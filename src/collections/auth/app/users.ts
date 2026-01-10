import { deleteLinkedAccounts } from 'payload-auth-plugin/collection/hooks'
import { AppUsersAccounts } from './accounts'
import { withUsersCollection } from 'payload-auth-plugin/collection'
import type { Endpoint } from 'payload'
import { APIError } from 'payload'
import { generateVerificationCode, hashVerificationCode, verifyCode, isVerificationExpired } from '@/hooks/emailVerification'

export const AppUsers = withUsersCollection({
  slug: 'app-users',
  admin: {
    defaultColumns: ['email', 'createdAt'],
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
    },
    {
      name: 'phoneNumber',
      type: 'text',
      label: 'Phone Number',
    },
    {
      name: 'profilePicture',
      type: 'upload',
      relationTo: 'profile-pictures', // Point to ProfilePictures collection
      admin: {
        description: 'Your profile picture (private - only visible to you and admins)',
      },
      access: {
        // Users can read their own profile picture
        read: ({ req: { user }, doc }) => {
          if (!user) return false
          // Admin can read all profile pictures
          if (user?.collection === 'admin-users') return true
          // Users can only read their own profile picture
          return user?.id === doc?.id
        },
        // Users can update their own profile picture
        update: ({ req: { user }, doc }) => {
          if (!user) return false
          // Admin can update all profile pictures
          if (user?.collection === 'admin-users') return true
          // Users can only update their own profile picture
          return user?.id === doc?.id
        },
      },
    },
  ],
  timestamps: true,
  hooks: {
    afterDelete: [deleteLinkedAccounts(AppUsersAccounts.slug)],
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && data?.email && !data?.verificationCode) {
          const verificationCode = generateVerificationCode()
          const verificationHash = hashVerificationCode(verificationCode)
          const expirationTime = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

          data.verificationCode = verificationCode
          data.verificationHash = verificationHash
          data.verificationTokenExpire = expirationTime
          data.verificationKind = 'email'
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        // After OAuth user creation, try to populate name from OAuth profile
        if (operation === 'create' && doc?.email && !doc.name) {
          // Get the OAuth account to extract name information
          const accounts = await req.payload.find({
            collection: 'app-user-accounts',
            where: {
              user: { equals: doc.id },
            },
            limit: 1,
          })

          if (accounts.docs.length > 0) {
            const account = accounts.docs[0]
            // Google OAuth profile data might be in account.profile or account.data
            // The auth plugin should handle this, but we can try to extract it
            const profileData = (account as any).profile || (account as any).data || {}
            
            if (profileData.name || profileData.given_name || profileData.family_name) {
              // Use full name if available, otherwise combine given_name and family_name
              const fullName = profileData.name || 
                [profileData.given_name, profileData.family_name].filter(Boolean).join(' ')

              if (fullName) {
                await req.payload.update({
                  collection: 'app-users',
                  id: doc.id,
                  data: {
                    name: fullName,
                  },
                  req,
                })
              }
            }
          }
        }

        if (operation === 'create' && doc?.verificationCode && doc?.email && doc?.verificationKind === 'email') {
          try {
            const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_URL || 'http://localhost:3000'
            const verificationCode = doc.verificationCode
            const verificationLink = `${serverURL}/api/app-users/verify-email?token=${doc.verificationCode}&email=${encodeURIComponent(doc.email)}`
            const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@superfreakstudio.com'
            const apiKey = process.env.RESEND_API_KEY
            
            if (!apiKey) {
              req.payload.logger.error('RESEND_API_KEY is not set in environment variables')
              throw new Error('Email service is not configured. Please contact support.')
            }

            await req.payload.sendEmail({
              to: doc.email,
              from: fromEmail,
              subject: 'Verify your email address',
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #292929; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #1D0DF3; margin: 0;">Superfreak Studio</h1>
                  </div>
                  <div style="background-color: #F8F8F8; border: 1px solid #DCDCDC; border-radius: 12px; padding: 30px;">
                    <h2 style="color: #292929; margin-top: 0;">Verify Your Email Address</h2>
                    <p>Thank you for signing up! Please verify your email address by entering the code below:</p>
                    <div style="background-color: white; border: 2px solid #1D0DF3; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
                      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1D0DF3; font-family: monospace;">
                        ${verificationCode}
                      </div>
                    </div>
                    <p style="margin-top: 20px;">Or click the link below to verify:</p>
                    <div style="text-align: center; margin: 20px 0;">
                      <a href="${verificationLink}" style="display: inline-block; background-color: #1D0DF3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 500;">Verify Email</a>
                    </div>
                    <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">This verification code will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
                  </div>
                </body>
                </html>
              `,
              text: `Verify your email address\n\nYour verification code is: ${verificationCode}\n\nOr visit this link to verify: ${verificationLink}\n\nThis code will expire in 24 hours.`,
            })
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            req.payload.logger.error(`Failed to send verification email to ${doc.email}: ${errorMessage}`)
          }
        }

        return doc
      },
    ],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user?.collection === 'admin-users') return true
      return { id: { equals: user?.id } }
    },
    update: ({ req: { user }, id }) => {
      if (!user) return false
      if (user?.collection === 'admin-users') return true
      return { id: { equals: user?.id } }
    },
    create: ({ req: { user } }) => {
      if (!user) return true
      if (user?.collection === 'admin-users') return true
      return false
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user?.collection === 'admin-users'
    },
  },
  endpoints: [
    {
      path: '/verify-email',
      method: 'post',
      handler: async (req) => {
        const body = await req.json?.()
        if (!body) {
          throw new APIError('Request body is required', 400)
        }
        const { email, code } = body

        if (!email || !code) {
          throw new APIError('Email and verification code are required', 400)
        }

        // Find user by email
        const users = await req.payload.find({
          collection: 'app-users',
          where: {
            email: { equals: email },
          },
          limit: 1,
          depth: 0,
        })

        if (users.docs.length === 0) {
          throw new APIError('User not found', 404)
        }

        const user = users.docs[0] as any

        // Check if user is already verified
        if (!user.verificationHash && !user.verificationCode) {
          return Response.json({ 
            success: true, 
            message: 'Email is already verified',
            verified: true 
          })
        }

        const codeToVerify = code.toUpperCase().trim()
        const storedCode = user.verificationCode
        const storedHash = user.verificationHash

        let isValid = false
        if (storedCode) {
          isValid = storedCode.toUpperCase() === codeToVerify
        } else if (storedHash) {
          isValid = verifyCode(codeToVerify, storedHash)
        }

        if (!isValid) {
          throw new APIError('Invalid verification code', 400)
        }

        if (isVerificationExpired(user.verificationTokenExpire)) {
          throw new APIError('Verification code has expired. Please request a new one.', 400)
        }

        await req.payload.update({
          collection: 'app-users',
          id: user.id,
          data: {
            verificationCode: null,
            verificationHash: null,
            verificationTokenExpire: null,
            verificationKind: null,
          },
          depth: 0,
        })

        return Response.json({ 
          success: true, 
          message: 'Email verified successfully',
          verified: true 
        })
      },
    },
    {
      path: '/resend-verification',
      method: 'post',
      handler: async (req) => {
        const body = await req.json?.()
        if (!body) {
          throw new APIError('Request body is required', 400)
        }
        const { email } = body

        if (!email) {
          throw new APIError('Email is required', 400)
        }

        // Find user by email
        const users = await req.payload.find({
          collection: 'app-users',
          where: {
            email: { equals: email },
          },
          limit: 1,
          depth: 0,
        })

        if (users.docs.length === 0) {
          throw new APIError('User not found', 404)
        }

        const user = users.docs[0] as any

        // Check if user is already verified
        if (!user.verificationHash && !user.verificationCode) {
          return Response.json({ 
            success: true, 
            message: 'Email is already verified',
            verified: true 
          })
        }

        const verificationCode = generateVerificationCode()
        const verificationHash = hashVerificationCode(verificationCode)
        const expirationTime = Date.now() + 24 * 60 * 60 * 1000

        await req.payload.update({
          collection: 'app-users',
          id: user.id,
          data: {
            verificationCode,
            verificationHash,
            verificationTokenExpire: expirationTime,
            verificationKind: 'email',
          },
          depth: 0,
        })

        try {
          const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@superfreakstudio.com'
          const apiKey = process.env.RESEND_API_KEY
          
          if (!apiKey) {
            throw new APIError('Email service is not configured. Please contact support.', 500)
          }

          await req.payload.sendEmail({
            to: user.email,
            from: fromEmail,
            subject: 'Verify your email address',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #292929; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #1D0DF3; margin: 0;">Superfreak Studio</h1>
                </div>
                <div style="background-color: #F8F8F8; border: 1px solid #DCDCDC; border-radius: 12px; padding: 30px;">
                  <h2 style="color: #292929; margin-top: 0;">Verify Your Email Address</h2>
                  <p>Please verify your email address by entering the code below:</p>
                  <div style="background-color: white; border: 2px solid #1D0DF3; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1D0DF3; font-family: monospace;">
                      ${verificationCode}
                    </div>
                  </div>
                  <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">This verification code will expire in 24 hours. If you didn't request this code, you can safely ignore this email.</p>
                </div>
              </body>
              </html>
            `,
            text: `Verify your email address\n\nYour verification code is: ${verificationCode}\n\nThis code will expire in 24 hours.`,
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          req.payload.logger.error(`Failed to send verification email to ${email}: ${errorMessage}`)
          throw new APIError(`Failed to send verification email: ${errorMessage}. Please check your Resend configuration.`, 500)
        }

        return Response.json({ 
          success: true, 
          message: 'Verification code sent successfully' 
        })
      },
    },
  ] as Endpoint[],
})

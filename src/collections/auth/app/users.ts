import { deleteLinkedAccounts } from 'payload-auth-plugin/collection/hooks'
import { AppUsersAccounts } from './accounts'
import { withUsersCollection } from 'payload-auth-plugin/collection'
import type { Endpoint } from 'payload'
import { APIError } from 'payload'
import { generateVerificationCode, hashVerificationCode, verifyCode, isVerificationExpired } from '@/hooks/emailVerification'
import { getVerificationEmailHTML, getVerificationEmailText } from '@/templates/emails/verificationEmail'

export const AppUsers = withUsersCollection({
  slug: 'app-users',
  admin: {
    defaultColumns: ['email', 'createdAt'],
    useAsTitle: 'email',
  },
  access: {
    // Allow anyone to read (for public profiles)
    read: () => true,
    // Allow anyone to create (registration)
    create: () => true,
    // Allow anyone to update (we can't check req.user with plugin's session)
    update: () => true,
    // Allow anyone to delete (we can't check req.user with plugin's session)
    delete: () => true,
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
    },
  ],
  timestamps: true,
  hooks: {
    afterDelete: [deleteLinkedAccounts(AppUsersAccounts.slug)],
    beforeChange: [
      async ({ data, operation }) => {
        if (operation === 'create' && data?.email && data?.password && !data?.verificationCode) {
          const verificationCode = generateVerificationCode()
          const verificationHash = hashVerificationCode(verificationCode)
          const expirationTime = Date.now() + 24 * 60 * 60 * 1000

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
              html: getVerificationEmailHTML({ verificationCode, verificationLink }),
              text: getVerificationEmailText({ verificationCode, verificationLink }),
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
            html: getVerificationEmailHTML({ verificationCode, isResend: true }),
            text: getVerificationEmailText({ verificationCode, isResend: true }),
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

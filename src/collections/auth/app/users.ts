import type { Endpoint, CollectionConfig } from 'payload'
import { APIError } from 'payload'
import {
  generateVerificationCode,
  hashVerificationCode,
  verifyCode,
  isVerificationExpired,
} from '@/hooks/emailVerification'
import {
  getVerificationEmailHTML,
  getVerificationEmailText,
} from '@/templates/emails/verificationEmail'

export const AppUsers: CollectionConfig = {
  slug: 'app-users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: ({ req: { user }, id }) => {
      console.log('[AppUsers Access Control - Update]', {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        userCollection: user?.collection,
        targetId: id,
        idsMatch: user?.id === id,
      })
      
      if (!user || !user.id) {
        console.log('[AppUsers Access Control] No user in request, denying access')
        return false
      }

      const isAdmin =
        user?.collection === 'admin-users' || (user as any)?._collection === 'admin-users'

      if (isAdmin) {
        console.log('[AppUsers Access Control] User is admin, allowing access')
        return true
      }

      const canUpdate = { id: { equals: user.id } }
      console.log('[AppUsers Access Control] Returning access rule:', canUpdate)
      return canUpdate
    },
    delete: ({ req: { user }, id }) => {
      if (!user || !user.id) return false

      const isAdmin =
        user?.collection === 'admin-users' || (user as any)?._collection === 'admin-users'

      if (isAdmin) return true

      return { id: { equals: user.id } }
    },
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
      relationTo: 'profile-pictures',
      admin: {
        description: 'Your profile picture (private - only visible to you and admins)',
      },
    },
    {
      name: 'googleId',
      type: 'text',
      admin: {
        hidden: true,
      },
      unique: true,
    },
    {
      name: 'authProvider',
      type: 'select',
      options: ['email', 'google'],
      defaultValue: 'email',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'verificationCode',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'verificationHash',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'verificationTokenExpire',
      type: 'number',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'verificationKind',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        if (
          operation === 'create' &&
          data?.email &&
          data?.password &&
          !data?.verificationCode &&
          data?.authProvider !== 'google'
        ) {
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
        if (
          operation === 'create' &&
          doc?.verificationCode &&
          doc?.email &&
          doc?.verificationKind === 'email' &&
          doc?.authProvider !== 'google'
        ) {
          try {
            const serverURL =
              process.env.NEXT_PUBLIC_SERVER_URL ||
              process.env.SERVER_URL ||
              'http://localhost:3000'
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
            req.payload.logger.error(
              `Failed to send verification email to ${doc.email}: ${errorMessage}`,
            )
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
            verified: true,
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
          verified: true,
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
            verified: true,
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
          throw new APIError(
            `Failed to send verification email: ${errorMessage}. Please check your Resend configuration.`,
            500,
          )
        }

        return Response.json({
          success: true,
          message: 'Verification code sent successfully',
        })
      },
    },
    {
      path: '/debug-auth',
      method: 'get',
      handler: async (req) => {
        try {
          const cookies = req.headers.get('cookie') || ''
          const cookieArray = cookies.split(';').map(c => c.trim())
          
          const authCookie = cookieArray.find(c => c.startsWith('payload-token-app-users='))
          const token = authCookie ? decodeURIComponent(authCookie.split('=').slice(1).join('=')) : null

          let decodedToken = null
          let userFromToken = null
          let tokenError = null
          
          if (token) {
            try {
              const jwt = await import('jsonwebtoken')
              const secret = process.env.PAYLOAD_SECRET
              if (secret) {
                decodedToken = jwt.verify(token, secret) as { id: string; email: string; collection: string }
                if (decodedToken?.id) {
                  try {
                    userFromToken = await req.payload.findByID({
                      collection: 'app-users',
                      id: decodedToken.id,
                      depth: 0,
                    })
                  } catch (error) {
                    tokenError = error instanceof Error ? error.message : String(error)
                    console.error('Error fetching user from token:', error)
                  }
                }
              }
            } catch (error) {
              tokenError = error instanceof Error ? error.message : String(error)
              console.error('Error decoding token:', error)
            }
          }

          return Response.json({
            hasUser: !!req.user,
            userId: req.user?.id || null,
            userEmail: req.user?.email || null,
            userCollection: req.user?.collection || null,
            hasAuthCookie: !!authCookie,
            tokenPreview: token ? token.substring(0, 30) + '...' : null,
            decodedToken,
            userFromToken: userFromToken ? {
              id: userFromToken.id,
              email: userFromToken.email,
              name: userFromToken.name,
            } : null,
            tokenError,
            allCookies: cookieArray,
          })
        } catch (error) {
          return Response.json({
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          }, { status: 500 })
        }
      },
    },
  ] as Endpoint[],
}

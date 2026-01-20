import type { BetterAuthOptions, PayloadAuthOptions } from 'payload-auth/better-auth'
import { nextCookies } from 'better-auth/next-js'

// Simplified: Only email/password with verification, no OTP, phone, organization, etc.
export const betterAuthPlugins = [
  nextCookies()
]

export type BetterAuthPlugins = typeof betterAuthPlugins

export const betterAuthOptions = {
  appName: 'Superfreak Studio',
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  trustedOrigins: [
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  ],
  secret: process.env.BETTER_AUTH_SECRET || process.env.PAYLOAD_SECRET || '',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    async sendResetPassword({ user, url }: { user: any; url: string }) {
      console.log('Send reset password for user: ', user.id, 'at url', url)
      // TODO: Implement password reset email sending via Resend
    }
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    }
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }: { user: any; url: string }) {
      console.log('Send verification email for user: ', url)
      // TODO: Implement email verification sending via Resend
    }
  },
  plugins: betterAuthPlugins,
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, newEmail, url, token }: { user: any; newEmail: string; url: string; token: string }) => {
        console.log('Send change email verification for user: ', user, newEmail, url, token)
        // TODO: Implement change email verification
      }
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url, token }: { user: any; url: string; token: string }) => {
        // Send delete account verification
        console.log('Send delete account verification: ', user, url, token)
      },
      beforeDelete: async (user: any) => {
        // Perform actions before user deletion
        console.log('Before delete user: ', user)
      },
      afterDelete: async (user: any) => {
        // Perform cleanup after user deletion
        console.log('After delete user: ', user)
      }
    }
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // Cache duration in seconds
    }
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'email-password']
    }
  }
} satisfies BetterAuthOptions

export type ConstructedBetterAuthOptions = typeof betterAuthOptions

export const betterAuthPluginOptions = {
  disabled: false,
  debug: {
    logTables: false,
    enableDebugLogs: false
  },
  disableDefaultPayloadAuth: true,
  hidePluginCollections: true,
  users: {
    slug: 'app-users', // Use app-users collection instead of users
    hidden: false,
    adminRoles: ['admin'],
    defaultRole: 'user',
    defaultAdminRole: 'admin',
    roles: ['user', 'admin'] as const, // Adjust roles as needed
    allowedFields: ['name', 'image', 'phoneNumber'] // Fields that can be updated via better-auth
  },
  accounts: {
    slug: 'accounts'
  },
  sessions: {
    slug: 'sessions'
  },
  verifications: {
    slug: 'verifications'
  },
  adminInvitations: {
    sendInviteEmail: async ({ payload, email, url }) => {
      console.log('Send admin invite: ', email, url)
      // TODO: Implement admin invite email sending
      return {
        success: true
      }
    }
  },
  betterAuthOptions: betterAuthOptions
} satisfies PayloadAuthOptions

export type ConstructedBetterAuthPluginOptions = typeof betterAuthPluginOptions

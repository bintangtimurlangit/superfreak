import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { authPlugin } from 'payload-auth-plugin'
import { GoogleAuthProvider, PasswordProvider } from 'payload-auth-plugin/providers'

import { AdminUsers } from './collections/auth/admin/users'
import { AdminAccounts } from './collections/auth/admin/accounts'
import { AppUsers } from './collections/auth/app/users'
import { AppUsersAccounts } from './collections/auth/app/accounts'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_URL || 'http://localhost:3000',
  admin: {
    user: AdminUsers.slug, // Use AdminUsers for admin panel
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [AdminUsers, AdminAccounts, AppUsers, AppUsersAccounts, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  email: resendAdapter({
    defaultFromAddress: process.env.RESEND_FROM_EMAIL || 'noreply@superfreakstudio.com',
    defaultFromName: process.env.RESEND_FROM_NAME || 'Superfreak Studio',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  sharp,
  plugins: [
    // Admin auth plugin - for admin panel users
    authPlugin({
      name: 'admin',
      useAdmin: true,
      allowOAuthAutoSignUp: true,
      usersCollectionSlug: AdminUsers.slug,
      accountsCollectionSlug: AdminAccounts.slug,
      successRedirectPath: '/admin/collections',
      errorRedirectPath: '/admin/auth/signin',
      providers: [
        GoogleAuthProvider({
          client_id: process.env.GOOGLE_CLIENT_ID as string,
          client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
        PasswordProvider({
          emailTemplates: {
            // Minimal no-op template - forgot password feature not implemented
            forgotPassword: async () => '',
          },
        }),
      ],
    }),
    // App auth plugin - for frontend users
    authPlugin({
      name: 'app',
      allowOAuthAutoSignUp: true,
      usersCollectionSlug: AppUsers.slug,
      accountsCollectionSlug: AppUsersAccounts.slug,
      successRedirectPath: '/',
      errorRedirectPath: '/auth/signin',
      providers: [
        GoogleAuthProvider({
          client_id: process.env.GOOGLE_CLIENT_ID as string,
          client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
        PasswordProvider({
          emailTemplates: {
            // Minimal no-op template - forgot password feature not implemented
            forgotPassword: async () => '',
          },
        }),
      ],
    }),
  ],
})

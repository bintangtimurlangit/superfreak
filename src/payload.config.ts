import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { resendAdapter } from '@payloadcms/email-resend'
import { s3Storage } from '@payloadcms/storage-s3'
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
import { UserFiles } from './collections/UserFiles'
import { ProfilePictures } from './collections/ProfilePictures'

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
  collections: [
    AdminUsers,
    AdminAccounts,
    AppUsers,
    AppUsersAccounts,
    Media,
    UserFiles,
    ProfilePictures,
  ],
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
    // Cloudflare R2 storage adapter (using S3-compatible API)
    s3Storage({
      collections: {
        // Public article images - stored in media/ folder
        media: {
          prefix: 'media', // Files will be stored in superfreak-media/media/
        },
        // Private user uploaded 3D files - stored in users/files/ folder
        'user-files': {
          prefix: 'users/files', // Files will be stored in superfreak-media/users/files/
        },
        // Private user profile pictures - stored in users/profile-pics/ folder
        'profile-pictures': {
          prefix: 'users/profile-pics', // Files will be stored in superfreak-media/users/profile-pics/
        },
      },
      bucket: process.env.R2_BUCKET_NAME || '',
      config: {
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        region: 'auto', // R2 uses 'auto' for region
      },
    }),
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

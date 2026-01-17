import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { resendAdapter } from '@payloadcms/email-resend'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { AdminUsers } from './collections/auth/admin/users'
import { AppUsers } from './collections/auth/app/users'
import { Media } from './collections/Media'
import { UserFiles } from './collections/UserFiles'
import { ProfilePictures } from './collections/ProfilePictures'
import { Addresses } from './collections/Addresses'
import { FilamentTypes } from './collections/FilamentTypes'
import { PrintingPricing } from './collections/PrintingPricing'
import { PrintingOptions } from './collections/PrintingOptions'
import { Orders } from './collections/Orders'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_URL || 'http://localhost:3000',
  cors: [
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  ],
  csrf: [
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  ],
  admin: {
    user: AdminUsers.slug, // Use AdminUsers for admin panel
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    AdminUsers,
    AppUsers,
    Media,
    UserFiles,
    ProfilePictures,
    Addresses,
    FilamentTypes,
    PrintingPricing,
    PrintingOptions,
    Orders,
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
  ],
})

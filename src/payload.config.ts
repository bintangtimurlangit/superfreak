import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { authPlugin } from 'payload-auth-plugin'
import { GoogleAuthProvider } from 'payload-auth-plugin/providers'

import { Users } from './collections/Users'
import { Accounts } from './collections/Accounts'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Accounts, Users, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  sharp,
  plugins: [
    authPlugin({
      name: 'admin',
      useAdmin: true,
      allowOAuthAutoSignUp: true,
      usersCollectionSlug: Users.slug,
      accountsCollectionSlug: Accounts.slug,
      successRedirectPath: '/admin/collections',
      errorRedirectPath: '/admin/auth/signin',
      providers: [
        GoogleAuthProvider({
          client_id: process.env.GOOGLE_CLIENT_ID as string,
          client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
      ],
    }),
  ],
})

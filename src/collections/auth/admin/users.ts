import { authenticated } from '@/access/authenticated'
import type { CollectionConfig } from 'payload'

const SUPER_ADMIN_EMAIL = 'superfreakstudio@gmail.com'

export const AdminUsers: CollectionConfig = {
  slug: 'admin-users',
  auth: true, // Native Payload auth
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'createdAt'],
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
    },
    {
      name: 'lastName',
      type: 'text',
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data, operation, req, originalDoc }) => {
        // Prevent changing super admin email
        if (data?.email === SUPER_ADMIN_EMAIL) {
          if (operation === 'update' && req?.user && originalDoc?.id) {
            const existingUser = await req.payload.findByID({
              collection: 'admin-users',
              id: originalDoc.id as string,
              depth: 0,
            })

            if (
              existingUser?.email === SUPER_ADMIN_EMAIL &&
              data.email &&
              data.email !== SUPER_ADMIN_EMAIL
            ) {
              throw new Error('Super admin email cannot be changed')
            }
          }
        }

        return data
      },
    ],
  },
  access: {
    admin: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
}

import { authenticated } from '@/access/authenticated'
import type { CollectionConfig } from 'payload'
import { deleteLinkedAccounts } from 'payload-auth-plugin/collection/hooks'
import { AdminAccounts } from './accounts'

const SUPER_ADMIN_EMAIL = 'superfreakstudio@gmail.com'

export const AdminUsers: CollectionConfig = {
  slug: 'admin-users',
  admin: {
    defaultColumns: ['email', 'createdAt'],
    useAsTitle: 'email',
  },
  auth: true, // This enables Payload's native initial admin creation
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
    afterDelete: [deleteLinkedAccounts(AdminAccounts.slug)],
    beforeChange: [
      async ({ data, operation, req, originalDoc }) => {
        // Prevent OAuth account linking for super admin email
        if (data?.email === SUPER_ADMIN_EMAIL) {
          // If this is an update and user is trying to change email, prevent it
          if (operation === 'update' && req?.user && originalDoc?.id) {
            const existingUser = await req.payload.findByID({
              collection: 'admin-users',
              id: originalDoc.id as string,
              depth: 0,
            })

            // Prevent changing super admin email
            if (existingUser?.email === SUPER_ADMIN_EMAIL && data.email && data.email !== SUPER_ADMIN_EMAIL) {
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

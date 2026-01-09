import type { CollectionConfig } from 'payload'
import { withAccountCollection } from 'payload-auth-plugin/collection'

const SUPER_ADMIN_EMAIL = 'superfreakstudio@gmail.com'

export const AdminAccounts: CollectionConfig = withAccountCollection(
  {
    slug: 'accounts',
    hooks: {
      beforeChange: [
        async ({ data, operation, req }) => {
          // Prevent OAuth account creation/linking for super admin email
          if (operation === 'create' && data?.user) {
            // Get the user to check their email
            const user = await req.payload.findByID({
              collection: 'admin-users',
              id: typeof data.user === 'string' ? data.user : data.user.id || data.user,
              depth: 0,
            })

            // Block OAuth account creation for super admin
            if (user?.email === SUPER_ADMIN_EMAIL) {
              throw new Error('OAuth accounts are not allowed for super admin. Please use email and password authentication.')
            }
          }

          return data
        },
      ],
    },
    access: {
      // Only allow reading accounts for the current user or admin
      read: ({ req: { user } }) => Boolean(user),
      create: ({ req: { user } }) => Boolean(user),
      update: ({ req: { user } }) => Boolean(user),
      delete: ({ req: { user } }) => Boolean(user),
    },
  },
  'admin-users' // Links to AdminUsers collection
)

// Hide from admin panel - only used internally for OAuth
if (AdminAccounts.admin) {
  AdminAccounts.admin.hidden = true
} else {
  AdminAccounts.admin = { hidden: true }
}

import { withAccountCollection } from 'payload-auth-plugin/collection'
import type { CollectionConfig } from 'payload'

export const AppUsersAccounts = withAccountCollection(
  {
    slug: 'app-user-accounts',
    hooks: {
      afterChange: [
        async ({ doc, operation, req }) => {
          if (operation === 'create' && doc?.user && doc?.name) {
            const userId = typeof doc.user === 'string' ? doc.user : (doc.user as any).id
            
            const user = await req.payload.findByID({
              collection: 'app-users',
              id: userId,
              depth: 0,
            })
            
            if (user && !(user as any).name) {
              await req.payload.update({
                collection: 'app-users',
                id: userId,
                data: { name: doc.name },
                req,
              })
            }
          }
        },
      ],
    },
  },
  'app-users' // Links to AppUsers collection
)

// Hide from admin panel - only used internally for OAuth
if (AppUsersAccounts.admin) {
  AppUsersAccounts.admin.hidden = true
} else {
  AppUsersAccounts.admin = { hidden: true }
}

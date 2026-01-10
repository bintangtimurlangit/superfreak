import { deleteLinkedAccounts } from 'payload-auth-plugin/collection/hooks'
import { AppUsersAccounts } from './accounts'
import { withUsersCollection } from 'payload-auth-plugin/collection'

export const AppUsers = withUsersCollection({
  slug: 'app-users',
  admin: {
    defaultColumns: ['email', 'createdAt'],
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      label: 'First Name',
    },
    {
      name: 'lastName',
      type: 'text',
      label: 'Last Name',
    },
    {
      name: 'profilePicture',
      type: 'upload',
      relationTo: 'profile-pictures', // Point to ProfilePictures collection
      admin: {
        description: 'Your profile picture (private - only visible to you and admins)',
      },
      access: {
        // Users can read their own profile picture
        read: ({ req: { user }, doc }) => {
          if (!user) return false
          // Admin can read all profile pictures
          if (user?.collection === 'admin-users') return true
          // Users can only read their own profile picture
          return user?.id === doc?.id
        },
        // Users can update their own profile picture
        update: ({ req: { user }, doc }) => {
          if (!user) return false
          // Admin can update all profile pictures
          if (user?.collection === 'admin-users') return true
          // Users can only update their own profile picture
          return user?.id === doc?.id
        },
      },
    },
  ],
  timestamps: true,
  hooks: {
    afterDelete: [deleteLinkedAccounts(AppUsersAccounts.slug)],
    afterChange: [
      async ({ doc, operation, req }) => {
        // After OAuth user creation, try to populate firstName/lastName from OAuth profile
        if (operation === 'create' && doc?.email && !doc.firstName && !doc.lastName) {
          // Get the OAuth account to extract name information
          const accounts = await req.payload.find({
            collection: 'app-user-accounts',
            where: {
              user: { equals: doc.id },
            },
            limit: 1,
          })

          if (accounts.docs.length > 0) {
            const account = accounts.docs[0]
            // Google OAuth profile data might be in account.profile or account.data
            // The auth plugin should handle this, but we can try to extract it
            const profileData = (account as any).profile || (account as any).data || {}
            
            if (profileData.name || profileData.given_name || profileData.family_name) {
              const nameParts = (profileData.name || '').split(' ')
              const firstName = profileData.given_name || nameParts[0] || ''
              const lastName = profileData.family_name || nameParts.slice(1).join(' ') || ''

              if (firstName || lastName) {
                await req.payload.update({
                  collection: 'app-users',
                  id: doc.id,
                  data: {
                    firstName: firstName || undefined,
                    lastName: lastName || undefined,
                  },
                  req,
                })
              }
            }
          }
        }
        return doc
      },
    ],
  },
  access: {
    // Users can read their own data
    read: ({ req: { user } }) => {
      if (!user) return false
      return { id: { equals: user?.id } }
    },
    // Users can update themselves
    update: ({ req: { user }, id }) => {
      if (!user) return false
      return { id: { equals: user?.id } }
    },
    // Allow OAuth signups (create without user in req)
    create: () => true,
    // Users cannot delete themselves
    delete: () => false,
  },
})

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
  ],
  timestamps: true,
  hooks: {
    afterDelete: [deleteLinkedAccounts(AppUsersAccounts.slug)],
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

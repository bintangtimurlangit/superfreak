import type { CollectionConfig } from 'payload'
import { withUsersCollection } from 'payload-auth-plugin/collection'

export const Users: CollectionConfig = withUsersCollection({
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'roles'],
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: ['admin', 'user'],
      defaultValue: ['user'],
      required: true,
      saveToJWT: true, // Include in JWT for fast access checks
      access: {
        // Only admins can update roles
        update: ({ req: { user } }) => user?.roles?.includes('admin'),
      },
    },
    {
      name: 'name',
      type: 'text',
      label: 'Full Name',
    },
  ],
  timestamps: true,
})

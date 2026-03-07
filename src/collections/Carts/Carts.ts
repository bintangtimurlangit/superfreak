import type { CollectionConfig } from 'payload'
import { hasRole } from '@/access/hasRoles'

export const Carts: CollectionConfig = {
  slug: 'carts',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'updatedAt'],
    description: 'One cart per user. Stores items (sliced 3D models) until order is created.',
  },
  access: {
    read: async ({ req }) => {
      const { user } = req
      if (!user) return false
      if (await hasRole(['admin'])({ req })) return true
      return { user: { equals: user.id } }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: async ({ req }) => {
      const { user } = req
      if (!user) return false
      if (await hasRole(['admin'])({ req })) return true
      return { user: { equals: user.id } }
    },
    delete: async ({ req }) => {
      const { user } = req
      if (!user) return false
      if (await hasRole(['admin'])({ req })) return true
      return { user: { equals: user.id } }
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'app-users',
      required: true,
      unique: true,
      admin: {
        readOnly: true,
        description: 'One cart per user.',
      },
    },
    {
      name: 'items',
      type: 'json',
      required: true,
      defaultValue: [],
      admin: {
        description: 'Array of cart items (id, name, size, tempFileId, configuration, statistics).',
      },
    },
  ],
  timestamps: true,
}

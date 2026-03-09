import type { CollectionConfig } from 'payload'
import { publishOrderMessage } from '@/lib/redis'

const isAdmin = (user: { role?: string | string[] | null } | null | undefined): boolean => {
  if (!user || !user.role) return false
  return Array.isArray(user.role) ? user.role.includes('admin') : user.role === 'admin'
}

export const OrderMessages: CollectionConfig = {
  slug: 'order-messages',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['order', 'author', 'body', 'createdAt'],
    description: 'Per-order discussion messages between customer and admin (when order status is needs-discussion).',
  },
  access: {
    // API enforces order ownership when fetching messages; allow any authenticated user to read
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: () => false,
    delete: ({ req: { user } }) => isAdmin(user),
  },
  fields: [
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      hasMany: false,
      admin: {
        description: 'Order this message belongs to.',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'app-users',
      required: true,
      hasMany: false,
      admin: {
        description: 'User (customer or admin) who sent the message.',
      },
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Message content.',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return
        const orderId = typeof doc.order === 'object' && doc.order !== null && 'id' in doc.order
          ? (doc.order as { id: string }).id
          : (doc.order as string)
        if (!orderId) return
        await publishOrderMessage(orderId, {
          id: doc.id,
          order: orderId,
          author: typeof doc.author === 'object' && doc.author !== null && 'id' in doc.author
            ? (doc.author as { id: string }).id
            : doc.author,
          body: doc.body,
          createdAt: doc.createdAt,
        })
      },
    ],
  },
  timestamps: true,
}

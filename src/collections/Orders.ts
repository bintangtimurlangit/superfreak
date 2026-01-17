import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'user', 'status', 'totalAmount', 'createdAt'],
  },
  access: {
    // Users can only read their own orders
    read: ({ req: { user } }) => {
      if (!user) return false
      // Admin users can see all orders
      if (user.collection === 'admin-users') return true
      // App users can only see their own orders
      return {
        user: {
          equals: user.id,
        },
      }
    },
    // Only authenticated users can create orders
    create: ({ req: { user } }) => Boolean(user),
    // Only admins can update orders
    update: ({ req: { user } }) => user?.collection === 'admin-users',
    // Only admins can delete orders
    delete: ({ req: { user } }) => user?.collection === 'admin-users',
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        readOnly: true,
      },
      hooks: {
        beforeValidate: [
          ({ value, operation }) => {
            // Auto-generate order number on create
            if (operation === 'create' && !value) {
              const timestamp = Date.now()
              const random = Math.floor(Math.random() * 1000)
                .toString()
                .padStart(3, '0')
              return `ORD-${timestamp}-${random}`
            }
            return value
          },
        ],
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'app-users',
      required: true,
      hasMany: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'unpaid',
      options: [
        {
          label: 'Unpaid',
          value: 'unpaid',
        },
        {
          label: 'Checking',
          value: 'checking',
        },
        {
          label: 'Discuss',
          value: 'discuss',
        },
        {
          label: 'Printing',
          value: 'printing',
        },
        {
          label: 'Shipping',
          value: 'shipping',
        },
        {
          label: 'Delivery',
          value: 'delivery',
        },
        {
          label: 'Delivered',
          value: 'delivered',
        },
        {
          label: 'Done',
          value: 'done',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'file',
          type: 'relationship',
          relationTo: 'user-files',
          required: true,
        },
        {
          name: 'fileName',
          type: 'text',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
        },
        {
          name: 'configuration',
          type: 'group',
          fields: [
            {
              name: 'material',
              type: 'text',
              required: true,
            },
            {
              name: 'layerHeight',
              type: 'text',
              required: true,
            },
            {
              name: 'infill',
              type: 'text',
              required: true,
            },
            {
              name: 'wallCount',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          name: 'statistics',
          type: 'group',
          fields: [
            {
              name: 'printTime',
              type: 'number',
              admin: {
                description: 'Print time in minutes',
              },
            },
            {
              name: 'filamentWeight',
              type: 'number',
              admin: {
                description: 'Filament weight in grams',
              },
            },
          ],
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          min: 0,
        },
      ],
    },
    {
      name: 'totalAmount',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'paymentInfo',
      type: 'group',
      fields: [
        {
          name: 'paymentMethod',
          type: 'select',
          options: [
            { label: 'Bank Transfer', value: 'bank_transfer' },
            { label: 'Credit Card', value: 'credit_card' },
            { label: 'E-Wallet', value: 'e_wallet' },
          ],
        },
        {
          name: 'paymentStatus',
          type: 'select',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Paid', value: 'paid' },
            { label: 'Failed', value: 'failed' },
            { label: 'Refunded', value: 'refunded' },
          ],
          defaultValue: 'pending',
        },
        {
          name: 'transactionId',
          type: 'text',
        },
        {
          name: 'paidAt',
          type: 'date',
        },
      ],
    },
    {
      name: 'shippingAddress',
      type: 'relationship',
      relationTo: 'addresses',
      hasMany: false,
    },
    {
      name: 'trackingNumber',
      type: 'text',
      admin: {
        condition: (data) => ['shipping', 'delivery', 'delivered', 'done'].includes(data.status),
      },
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      admin: {
        description: 'Internal notes for admin use, especially for discuss status',
      },
    },
    {
      name: 'customerNotes',
      type: 'textarea',
      admin: {
        description: 'Notes from customer about the order',
      },
    },
    {
      name: 'statusHistory',
      type: 'array',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'status',
          type: 'text',
          required: true,
        },
        {
          name: 'changedAt',
          type: 'date',
          required: true,
        },
        {
          name: 'changedBy',
          type: 'relationship',
          relationTo: ['admin-users', 'app-users'],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        // Track status changes
        if (operation === 'update' && originalDoc && data.status !== originalDoc.status) {
          const statusHistory = data.statusHistory || []
          statusHistory.push({
            status: data.status,
            changedAt: new Date().toISOString(),
            changedBy: req.user?.id,
          })
          data.statusHistory = statusHistory
        }
        return data
      },
    ],
  },
  timestamps: true,
}

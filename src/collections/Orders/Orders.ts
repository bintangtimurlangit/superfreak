import type { CollectionConfig } from 'payload'
import { hasRole } from '@/access/hasRoles'
import { finalizeOrderFiles } from './hooks/finalizeOrderFiles'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'user', 'status', 'totalAmount', 'createdAt'],
  },
  access: {
    read: async ({ req }) => {
      const { user } = req
      if (!user) return false
      if (await hasRole(['admin'])({ req })) return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: hasRole(['admin']),
    delete: hasRole(['admin']),
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      unique: true,
      admin: {
        readOnly: true,
      },
      hooks: {
        beforeValidate: [
          ({ value, operation }) => {
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
      required: false, // Will be auto-populated by hook
      hasMany: false,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      hooks: {
        beforeValidate: [
          ({ req, value }) => {
            // Auto-populate user from authenticated session
            if (!value && req.user) {
              return req.user.id
            }
            return value
          },
        ],
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
          label: 'In Review',
          value: 'in-review',
        },
        {
          label: 'Needs Discussion',
          value: 'needs-discussion',
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
          label: 'In Delivery',
          value: 'in-delivery',
        },
        {
          label: 'Delivered',
          value: 'delivered',
        },
        {
          label: 'Completed',
          value: 'completed',
        },
        {
          label: 'Canceled',
          value: 'canceled',
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
          type: 'text',
          required: true,
          admin: {
            description: 'Temporary file ID or reference',
          },
        },
        {
          name: 'fileName',
          type: 'text',
          required: true,
        },
        {
          name: 'fileSize',
          type: 'number',
          admin: {
            description: 'File size in bytes',
          },
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
              name: 'color',
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
          name: 'pricing',
          type: 'group',
          admin: {
            description: 'Pricing snapshot at order creation',
          },
          fields: [
            {
              name: 'pricePerGram',
              type: 'number',
              required: true,
              admin: {
                description: 'Price per gram at time of order (IDR) - based on layer height',
              },
            },
          ],
        },
        {
          name: 'totalPrice',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            description: 'Total price for this item (subtotalPerUnit × quantity)',
          },
        },
      ],
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
            { label: 'E-Wallet & QRIS', value: 'e_wallet' },
          ],
        },
        {
          name: 'specificPaymentMethod',
          type: 'text',
          admin: {
            description: 'The specific Midtrans payment type used (e.g., bca_va, gopay)',
          },
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
        {
          name: 'midtransOrderId',
          type: 'text',
          admin: {
            description: 'Midtrans order ID',
          },
        },
        {
          name: 'midtransSnapToken',
          type: 'text',
          admin: {
            description: 'Midtrans Snap token for payment',
          },
        },
        {
          name: 'midtransSnapUrl',
          type: 'text',
          admin: {
            description: 'Midtrans Snap payment URL',
          },
        },
        {
          name: 'paymentExpiry',
          type: 'date',
          admin: {
            description: 'Payment expiration date/time',
          },
        },
      ],
    },
    {
      name: 'summary',
      type: 'group',
      admin: {
        description: 'Order totals and summary',
      },
      fields: [
        {
          name: 'subtotal',
          type: 'number',
          required: true,
          admin: {
            description: 'Sum of all item prices',
          },
        },
        {
          name: 'shippingCost',
          type: 'number',
          required: true,
          admin: {
            description: 'Shipping cost snapshot',
          },
        },
        {
          name: 'totalAmount',
          type: 'number',
          required: true,
          admin: {
            description: 'Subtotal + shipping cost',
          },
        },
        {
          name: 'totalWeight',
          type: 'number',
          admin: {
            description: 'Total filament weight in grams',
          },
        },
        {
          name: 'totalPrintTime',
          type: 'number',
          admin: {
            description: 'Total print time in minutes',
          },
        },
      ],
    },
    {
      name: 'shipping',
      type: 'group',
      admin: {
        description: 'Complete shipping information snapshot',
      },
      fields: [
        {
          name: 'addressId',
          type: 'relationship',
          relationTo: 'addresses',
          admin: {
            description: 'Reference to original address (for tracking only)',
          },
        },
        {
          name: 'recipientName',
          type: 'text',
        },
        {
          name: 'phoneNumber',
          type: 'text',
        },
        {
          name: 'addressLine1',
          type: 'text',
        },
        {
          name: 'addressLine2',
          type: 'text',
        },
        {
          name: 'villageName',
          type: 'text',
        },
        {
          name: 'districtName',
          type: 'text',
        },
        {
          name: 'regencyName',
          type: 'text',
        },
        {
          name: 'provinceName',
          type: 'text',
        },
        {
          name: 'postalCode',
          type: 'text',
        },
        {
          name: 'courier',
          type: 'text',
          admin: {
            description: 'Courier name (e.g., JNE, TIKI)',
          },
        },
        {
          name: 'service',
          type: 'text',
          admin: {
            description: 'Service type (e.g., REG, YES)',
          },
        },
        {
          name: 'estimatedDelivery',
          type: 'text',
          admin: {
            description: 'Estimated delivery time (e.g., 2-3 days)',
          },
        },
        {
          name: 'shippingCost',
          type: 'number',
          admin: {
            description: 'Shipping cost snapshot from RajaOngkir (IDR)',
          },
        },
        {
          name: 'totalWeight',
          type: 'number',
          admin: {
            description: 'Total package weight in grams',
          },
        },
        {
          name: 'trackingNumber',
          type: 'text',
          admin: {
            condition: (data) =>
              ['shipping', 'in-delivery', 'delivered', 'completed'].includes(data.status),
          },
        },
        {
          name: 'shippedAt',
          type: 'date',
          admin: {
            condition: (data) =>
              ['shipping', 'in-delivery', 'delivered', 'completed'].includes(data.status),
          },
        },
        {
          name: 'deliveredAt',
          type: 'date',
          admin: {
            condition: (data) => ['delivered', 'completed'].includes(data.status),
          },
        },
      ],
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      admin: {
        description: 'Internal notes for admin use, especially for needs-discussion status',
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
          relationTo: 'app-users',
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
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
    afterChange: [finalizeOrderFiles],
  },
  timestamps: true,
}

import type { CollectionConfig } from 'payload'

export const Addresses: CollectionConfig = {
  slug: 'addresses',
  admin: {
    defaultColumns: ['recipientName', 'provinceCode', 'regencyCode', 'isDefault', 'createdAt'],
    useAsTitle: 'recipientName',
    hidden: true,
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'app-users',
      required: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'recipientName',
      type: 'text',
      label: 'Recipient Name',
      required: true,
    },
    {
      name: 'phoneNumber',
      type: 'text',
      label: 'Phone Number',
      required: true,
    },
    {
      name: 'addressLine1',
      type: 'text',
      label: 'Address Line 1',
      required: true,
    },
    {
      name: 'addressLine2',
      type: 'text',
      label: 'Address Line 2',
      admin: {
        description: 'House number, RT, RW (optional)',
      },
    },
    {
      name: 'provinceCode',
      type: 'text',
      label: 'Province',
      required: true,
    },
    {
      name: 'regencyCode',
      type: 'text',
      label: 'City/Regency',
      required: true,
    },
    {
      name: 'districtCode',
      type: 'text',
      label: 'District',
      required: true,
    },
    {
      name: 'villageCode',
      type: 'text',
      label: 'Village/Sub-district',
      required: true,
    },
    {
      name: 'postalCode',
      type: 'text',
      label: 'Postal Code',
      required: true,
      validate: (value: string | null | undefined) => {
        if (value && value.length !== 5) {
          return 'Postal code must be 5 digits'
        }
        return true
      },
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      label: 'Default Address',
      defaultValue: false,
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data, operation, req, originalDoc }) => {
        if (operation === 'create' && data?.user) {
          const userId = typeof data.user === 'string' ? data.user : (data.user as any).id

          const existingAddresses = await req.payload.find({
            collection: 'addresses',
            where: {
              user: { equals: userId },
            },
            limit: 0,
          })

          if (existingAddresses.totalDocs >= 3) {
            throw new Error('Maximum 3 addresses allowed per user')
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create' && doc?.isDefault && doc?.user) {
          const userId = typeof doc.user === 'string' ? doc.user : (doc.user as any).id

          await req.payload.update({
            collection: 'addresses',
            where: {
              user: { equals: userId },
              id: { not_equals: doc.id },
              isDefault: { equals: true },
            },
            data: {
              isDefault: false,
            },
            req,
          })
        }

        if (operation === 'update' && doc?.isDefault && doc?.user) {
          const userId = typeof doc.user === 'string' ? doc.user : (doc.user as any).id

          await req.payload.update({
            collection: 'addresses',
            where: {
              user: { equals: userId },
              id: { not_equals: doc.id },
              isDefault: { equals: true },
            },
            data: {
              isDefault: false,
            },
            req,
          })
        }

        return doc
      },
    ],
  },
}

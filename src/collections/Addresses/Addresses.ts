import type { CollectionConfig } from 'payload'

export const Addresses: CollectionConfig = {
  slug: 'addresses',
  admin: {
    defaultColumns: ['recipientName', 'user', 'provinceCode', 'regencyCode', 'isDefault', 'createdAt'],
    useAsTitle: 'recipientName',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'admin-users') return true
      return {
        user: { equals: user.id },
      }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'admin-users') return true
      return {
        user: { equals: user.id },
      }
    },
    delete: async ({ req, id }) => {
      const { user } = req
      if (!user) return false
      if (user.collection === 'admin-users') return true
      
      if (!id) return false
      
      const address = await req.payload.findByID({
        collection: 'addresses',
        id: id as string,
        depth: 0,
      })
      
      if (!address) return false
      
      const addressUserId = typeof address.user === 'string' ? address.user : (address.user as { id: string }).id
      return addressUserId === user.id
    },
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
      async ({ data, operation, req }) => {
        if (operation === 'create') {
          const userId = req.user?.id || (data?.user ? (typeof data.user === 'string' ? data.user : (data.user as { id: string }).id) : null)
          
          if (!userId) {
            throw new Error('User is required')
          }

          if (!data.user) {
            data.user = userId
          }

          const existingAddresses = await req.payload.find({
            collection: 'addresses',
            where: {
              user: { equals: userId },
            },
            limit: 0,
            overrideAccess: false,
            user: req.user,
          })

          if (existingAddresses.totalDocs >= 3) {
            throw new Error('Maximum 3 addresses allowed per user')
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req, context }) => {
        if (context.skipDefaultUpdate) return doc

        if ((operation === 'create' || operation === 'update') && doc?.isDefault && doc?.user) {
          const userId = typeof doc.user === 'string' ? doc.user : String((doc.user as { id: string }).id)

          const otherDefaultAddresses = await req.payload.find({
            collection: 'addresses',
            where: {
              and: [
                { user: { equals: userId } },
                { id: { not_equals: doc.id } },
                { isDefault: { equals: true } },
              ],
            },
            limit: 100,
            overrideAccess: false,
            user: req.user,
          })

          for (const address of otherDefaultAddresses.docs) {
            await req.payload.update({
              collection: 'addresses',
              id: address.id,
              data: {
                isDefault: false,
              },
              req,
              overrideAccess: false,
              user: req.user,
              context: { skipDefaultUpdate: true },
            })
          }
        }

        return doc
      },
    ],
  },
}

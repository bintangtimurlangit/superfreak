import type { CollectionConfig } from 'payload'
import { hasRole } from '@/access/hasRoles'

export const Addresses: CollectionConfig = {
  slug: 'addresses',
  admin: {
    defaultColumns: [
      'recipientName',
      'user',
      'provinceCode',
      'regencyCode',
      'isDefault',
      'createdAt',
    ],
    useAsTitle: 'recipientName',
  },
  access: {
    read: async ({ req }) => {
      const { user } = req
      if (!user) return false
      if (await hasRole(['admin'])({ req })) return true
      return {
        user: { equals: user.id },
      }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: async ({ req }) => {
      const { user } = req
      if (!user) return false
      if (await hasRole(['admin'])({ req })) return true
      return {
        user: { equals: user.id },
      }
    },
    delete: async ({ req, id }) => {
      const { user } = req
      if (!user) return false
      if (await hasRole(['admin'])({ req })) return true

      if (!id) return false

      const address = await req.payload.findByID({
        collection: 'addresses',
        id: id as string,
        depth: 0,
      })

      if (!address) return false

      const addressUserId =
        typeof address.user === 'string' ? address.user : (address.user as { id: string }).id
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
    // RajaOngkir Integration Fields
    {
      type: 'collapsible',
      label: 'Shipping Integration (RajaOngkir)',
      admin: {
        description: 'Auto-populated shipping data for cost calculation',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'rajaOngkirDestinationId',
          type: 'number',
          label: 'RajaOngkir Destination ID',
          admin: {
            description: 'Location ID from RajaOngkir API (auto-populated when address is saved)',
            readOnly: true,
            position: 'sidebar',
          },
        },
        {
          name: 'rajaOngkirLocationLabel',
          type: 'text',
          label: 'RajaOngkir Location Label',
          admin: {
            description: 'Full location label from RajaOngkir for verification',
            readOnly: true,
          },
        },
        {
          name: 'rajaOngkirZipCode',
          type: 'text',
          label: 'RajaOngkir Zip Code',
          admin: {
            description: 'Zip code from RajaOngkir (may differ from user input)',
            readOnly: true,
          },
        },
        {
          name: 'rajaOngkirLastVerified',
          type: 'date',
          label: 'Last Verified',
          admin: {
            description: 'Last time RajaOngkir location was verified',
            readOnly: true,
            date: {
              displayFormat: 'dd MMM yyyy HH:mm',
            },
          },
        },
        {
          name: 'rajaOngkirProvinceName',
          type: 'text',
          label: 'Province (RajaOngkir)',
          admin: {
            description: 'Province name from RajaOngkir',
            readOnly: true,
          },
        },
        {
          name: 'rajaOngkirCityName',
          type: 'text',
          label: 'City (RajaOngkir)',
          admin: {
            description: 'City name from RajaOngkir',
            readOnly: true,
          },
        },
        {
          name: 'rajaOngkirDistrictName',
          type: 'text',
          label: 'District (RajaOngkir)',
          admin: {
            description: 'District name from RajaOngkir',
            readOnly: true,
          },
        },
        {
          name: 'rajaOngkirSubdistrictName',
          type: 'text',
          label: 'Subdistrict (RajaOngkir)',
          admin: {
            description: 'Subdistrict name from RajaOngkir',
            readOnly: true,
          },
        },
      ],
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create') {
          const userId =
            req.user?.id ||
            (data?.user
              ? typeof data.user === 'string'
                ? data.user
                : (data.user as { id: string }).id
              : null)

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
          const userId =
            typeof doc.user === 'string' ? doc.user : String((doc.user as { id: string }).id)

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

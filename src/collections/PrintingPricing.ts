import type { CollectionConfig } from 'payload'

export const PrintingPricing: CollectionConfig = {
  slug: 'printing-pricing',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['filamentType', 'isActive', 'createdAt'],
  },
  access: {
    read: () => true, // Public read access
    create: ({ req: { user } }) => {
      // Only admin users can create
      return user?.collection === 'admin-users'
    },
    update: ({ req: { user } }) => {
      // Only admin users can update
      return user?.collection === 'admin-users'
    },
    delete: ({ req: { user } }) => {
      // Only admin users can delete
      return user?.collection === 'admin-users'
    },
  },
  fields: [
    {
      name: 'filamentType',
      type: 'relationship',
      relationTo: 'filament-types',
      required: true,
      admin: {
        description: 'Select the filament type',
      },
    },
    {
      name: 'pricingTable',
      type: 'array',
      label: 'Pricing Table',
      required: true,
      minRows: 1,
      admin: {
        description: 'Add layer heights and their corresponding prices per gram',
      },
      fields: [
        {
          name: 'layerHeight',
          type: 'number',
          label: 'Layer Height (mm)',
          required: true,
          admin: {
            step: 0.01,
            description: 'e.g., 0.08, 0.12, 0.16, 0.20, 0.24, 0.28',
          },
          validate: (value: number | null | undefined) => {
            if (value === null || value === undefined) {
              return 'Layer height is required'
            }
            if (value < 0.01 || value > 1.0) {
              return 'Layer height must be between 0.01 and 1.0 mm'
            }
            return true
          },
        },
        {
          name: 'pricePerGram',
          type: 'number',
          label: 'Price per Gram (Rp)',
          required: true,
          admin: {
            step: 1,
            description: 'Price in Indonesian Rupiah per gram',
          },
          validate: (value: number | null | undefined) => {
            if (value === null || value === undefined) {
              return 'Price per gram is required'
            }
            if (value < 0) {
              return 'Price must be positive'
            }
            return true
          },
        },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
      admin: {
        description: 'Uncheck to hide this pricing option from users',
      },
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
      },
      hooks: {
        beforeValidate: [
          async ({ data, req }) => {
            if (data.filamentType) {
              const filamentId =
                typeof data.filamentType === 'string'
                  ? data.filamentType
                  : (data.filamentType as { id: string }).id

              const filament = await req.payload.findByID({
                collection: 'filament-types',
                id: filamentId,
                depth: 0,
              })

              if (filament) {
                return `${filament.name} Pricing`
              }
            }
            return ''
          },
        ],
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data, operation, req, id }) => {
        // Ensure unique filament type per document
        if (operation === 'create' || operation === 'update') {
          const filamentId =
            typeof data.filamentType === 'string'
              ? data.filamentType
              : (data.filamentType as { id: string }).id

          if (!filamentId) {
            return data
          }

          const whereClause: any = {
            filamentType: { equals: filamentId },
          }

          // If updating, exclude current document
          if (operation === 'update' && id) {
            whereClause.id = { not_equals: id }
          }

          const existing = await req.payload.find({
            collection: 'printing-pricing',
            where: whereClause,
            limit: 1,
            overrideAccess: true,
          })

          if (existing.docs.length > 0) {
            throw new Error(
              'A pricing entry already exists for this filament type. Please update the existing entry instead.',
            )
          }

          // Validate unique layer heights within the pricing table
          if (data.pricingTable && Array.isArray(data.pricingTable)) {
            const layerHeights = data.pricingTable
              .map((row: any) => row.layerHeight)
              .filter(
                (height: number | null | undefined) => height !== null && height !== undefined,
              )

            const uniqueLayerHeights = new Set(layerHeights)
            if (layerHeights.length !== uniqueLayerHeights.size) {
              throw new Error(
                'Duplicate layer heights found in the pricing table. Each layer height must be unique.',
              )
            }
          }
        }

        return data
      },
    ],
  },
}

import type { CollectionConfig } from 'payload'
import { hasRole } from '@/access/hasRoles'

export const FilamentTypes: CollectionConfig = {
  slug: 'filament-types',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'isActive', 'createdAt'],
  },
  access: {
    read: () => true,
    create: hasRole(['admin']),
    update: hasRole(['admin']),
    delete: hasRole(['admin']),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Filament Type',
      required: true,
      unique: true,
      admin: {
        description: 'e.g., PLA, PETG, TPU, ASA, ABS',
      },
    },
    {
      name: 'colors',
      type: 'array',
      label: 'Available Colors',
      minRows: 1,
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Color Name',
          required: true,
        },
        {
          name: 'hexCode',
          type: 'text',
          label: 'Hex Color Code',
          admin: {
            description: 'Optional: Hex code for color display (e.g., #FF0000)',
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
        description: 'Uncheck to hide this filament type from users',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: {
        description: 'Optional description of this filament type',
      },
    },
  ],
  timestamps: true,
}

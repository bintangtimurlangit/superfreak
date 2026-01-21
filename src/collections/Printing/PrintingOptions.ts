import type { CollectionConfig } from 'payload'
import { hasRole } from '@/access/hasRoles'

export const PrintingOptions: CollectionConfig = {
  slug: 'printing-options',
  admin: {
    useAsTitle: 'type',
    defaultColumns: ['type', 'isActive', 'createdAt'],
  },
  access: {
    read: () => true,
    create: hasRole(['admin']),
    update: hasRole(['admin']),
    delete: hasRole(['admin']),
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      label: 'Option Type',
      required: true,
      unique: true,
      options: [
        {
          label: 'Infill Percentage',
          value: 'infill',
        },
        {
          label: 'Wall Count Limit',
          value: 'wallCount',
        },
      ],
      admin: {
        description: 'The type of printing option',
      },
    },
    {
      name: 'values',
      type: 'array',
      label: 'Available Values',
      minRows: 1,
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Display Label',
          required: true,
          admin: {
            description: 'e.g., "20%" or "0.12mm"',
          },
        },
        {
          name: 'value',
          type: 'text',
          label: 'Value',
          required: true,
          admin: {
            description: 'The actual value (e.g., "20" for 20%, "0.12" for layer height)',
          },
        },
        {
          name: 'isActive',
          type: 'checkbox',
          label: 'Active',
          defaultValue: true,
          admin: {
            description: 'Uncheck to hide this option from users',
          },
        },
      ],
    },
    {
      name: 'maxValue',
      type: 'number',
      label: 'Maximum Value',
      admin: {
        description: 'For numeric options like wall count, set the maximum allowed value',
        condition: (data) => data.type === 'wallCount',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
      admin: {
        description: 'Uncheck to hide this option set from users',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: {
        description: 'Optional description of this option',
      },
    },
  ],
  timestamps: true,
}

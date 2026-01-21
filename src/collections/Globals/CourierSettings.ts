import type { GlobalConfig } from 'payload'

export const CourierSettings: GlobalConfig = {
  slug: 'courier-settings',
  label: 'Courier Settings',
  admin: {
    group: 'Settings',
    description: 'Configure shipping couriers and warehouse settings for RajaOngkir',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => {
      return user?.role?.includes('admin') || false
    },
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Warehouse',
          description: 'Configure your warehouse location for shipping calculations',
          fields: [
            {
              name: 'warehouseId',
              type: 'number',
              label: 'Warehouse RajaOngkir ID',
              required: true,
              defaultValue: 73633,
              admin: {
                description:
                  'Your warehouse location ID from RajaOngkir (origin for shipping calculations)',
                placeholder: '73633',
              },
            },
            {
              name: 'warehouseName',
              type: 'text',
              label: 'Warehouse Name',
              admin: {
                description: 'Name/label for your warehouse location (for reference)',
                placeholder: 'e.g., Jakarta Warehouse',
              },
            },
            {
              name: 'warehouseAddress',
              type: 'textarea',
              label: 'Warehouse Address',
              admin: {
                description: 'Full warehouse address (for reference)',
                rows: 3,
              },
            },
          ],
        },
        {
          label: 'Available Couriers',
          description: 'Select which courier services are available for your customers',
          fields: [
            {
              name: 'enabledCouriers',
              type: 'select',
              label: 'Enabled Courier Services',
              hasMany: true,
              required: true,
              defaultValue: ['jne', 'jnt', 'sicepat'],
              options: [
                {
                  label: 'JNE (Jalur Nugraha Ekakurir)',
                  value: 'jne',
                },
                {
                  label: 'J&T Express',
                  value: 'jnt',
                },
                {
                  label: 'SiCepat',
                  value: 'sicepat',
                },
                {
                  label: 'ID Express',
                  value: 'ide',
                },
                {
                  label: 'SAP Express',
                  value: 'sap',
                },
                {
                  label: 'Ninja Xpress',
                  value: 'ninja',
                },
                {
                  label: 'TIKI',
                  value: 'tiki',
                },
                {
                  label: 'Lion Parcel',
                  value: 'lion',
                },
                {
                  label: 'AnterAja',
                  value: 'anteraja',
                },
                {
                  label: 'POS Indonesia',
                  value: 'pos',
                },
                {
                  label: 'NCS (Nusantara Card Semesta)',
                  value: 'ncs',
                },
                {
                  label: 'REX (Royal Express)',
                  value: 'rex',
                },
                {
                  label: 'RPX (RPX Holding)',
                  value: 'rpx',
                },
                {
                  label: 'Sentral Cargo',
                  value: 'sentral',
                },
                {
                  label: 'Star Cargo',
                  value: 'star',
                },
                {
                  label: 'Wahana',
                  value: 'wahana',
                },
                {
                  label: 'DSE (21 Express)',
                  value: 'dse',
                },
              ],
              admin: {
                description:
                  'Select all courier services you want to offer. These will be available during checkout.',
                isClearable: true,
                isSortable: true,
              },
            },
            {
              name: 'courierDisplayOrder',
              type: 'array',
              label: 'Courier Display Order',
              admin: {
                description:
                  'Drag to reorder how couriers appear in checkout (optional - defaults to alphabetical)',
                initCollapsed: true,
              },
              fields: [
                {
                  name: 'courier',
                  type: 'select',
                  label: 'Courier',
                  required: true,
                  options: [
                    { label: 'JNE', value: 'jne' },
                    { label: 'J&T Express', value: 'jnt' },
                    { label: 'SiCepat', value: 'sicepat' },
                    { label: 'ID Express', value: 'ide' },
                    { label: 'SAP Express', value: 'sap' },
                    { label: 'Ninja Xpress', value: 'ninja' },
                    { label: 'TIKI', value: 'tiki' },
                    { label: 'Lion Parcel', value: 'lion' },
                    { label: 'AnterAja', value: 'anteraja' },
                    { label: 'POS Indonesia', value: 'pos' },
                    { label: 'NCS', value: 'ncs' },
                    { label: 'REX', value: 'rex' },
                    { label: 'RPX', value: 'rpx' },
                    { label: 'Sentral Cargo', value: 'sentral' },
                    { label: 'Star Cargo', value: 'star' },
                    { label: 'Wahana', value: 'wahana' },
                    { label: 'DSE', value: 'dse' },
                  ],
                },
                {
                  name: 'priority',
                  type: 'number',
                  label: 'Priority',
                  admin: {
                    description: 'Lower numbers appear first (1 = highest priority)',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Shipping Options',
          description: 'Additional shipping configuration',
          fields: [
            {
              name: 'freeShippingThreshold',
              type: 'number',
              label: 'Free Shipping Threshold (IDR)',
              admin: {
                description:
                  'Minimum order value for free shipping (set to 0 to disable free shipping)',
                placeholder: '500000',
                step: 1000,
              },
            },
            {
              name: 'defaultShippingService',
              type: 'select',
              label: 'Default Shipping Service',
              admin: {
                description: 'Which courier service to pre-select in checkout (optional)',
              },
              options: [
                { label: 'None (let customer choose)', value: '' },
                { label: 'JNE', value: 'jne' },
                { label: 'J&T Express', value: 'jnt' },
                { label: 'SiCepat', value: 'sicepat' },
              ],
            },
            {
              name: 'estimatedProcessingDays',
              type: 'number',
              label: 'Processing Time (Days)',
              defaultValue: 1,
              required: true,
              admin: {
                description:
                  'How many days it takes to process orders before shipping (added to courier delivery time)',
                step: 1,
              },
            },
          ],
        },
      ],
    },
  ],
}

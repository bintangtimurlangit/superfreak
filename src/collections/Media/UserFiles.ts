import type { CollectionConfig } from 'payload'

export const UserFiles: CollectionConfig = {
  slug: 'user-files',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'fileType', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'fileType',
      type: 'select',
      options: [
        { label: '3D Model (STL)', value: 'stl' },
        { label: '3D Model (OBJ)', value: 'obj' },
        { label: '3D Model (GLB/GLTF)', value: 'glb' },
        { label: '3D Model (FBX)', value: 'fbx' },
        { label: 'Other', value: 'other' },
      ],
      defaultValue: 'other',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
    },
  ],
  upload: {
    mimeTypes: [
      'model/stl',
      'model/obj',
      'model/gltf-binary',
      'model/gltf+json',
      'application/x-msdownload',
      'text/plain',
      'application/octet-stream',
    ],
    filesRequiredOnCreate: false,
    imageSizes: [],
  },
  timestamps: true,
}

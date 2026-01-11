import type { CollectionConfig } from 'payload'

export const UserFiles: CollectionConfig = {
  slug: 'user-files',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'fileType', 'createdAt'],
  },
  access: {
    // Allow anyone (we'll handle auth via hooks)
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
    // Only allow 3D file formats
    mimeTypes: [
      'model/stl',
      'model/obj',
      'model/gltf-binary',
      'model/gltf+json',
      'application/x-msdownload', // .stl
      'text/plain', // .obj (sometimes)
      'application/octet-stream', // Generic binary
    ],
    // Increase max file size for 3D files (50MB)
    filesRequiredOnCreate: false,
    imageSizes: [],
  },
  timestamps: true,
}

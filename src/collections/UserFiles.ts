import type { CollectionConfig } from 'payload'

export const UserFiles: CollectionConfig = {
  slug: 'user-files',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'uploadedBy', 'fileType', 'createdAt'],
  },
  access: {
    // Users can only read their own files
    read: ({ req: { user } }) => {
      if (!user) return false
      // Admin can read all files
      if (user?.collection === 'admin-users') return true
      // Regular users can only read their own files
      return {
        uploadedBy: { equals: user.id },
      }
    },
    // Users can create files for themselves
    create: ({ req: { user } }) => {
      if (!user) return false
      // Only allow authenticated app users to create files
      return user?.collection === 'app-users'
    },
    // Users can update their own files
    update: ({ req: { user }, id }) => {
      if (!user) return false
      // Admin can update all files
      if (user?.collection === 'admin-users') return true
      // Regular users can only update their own files
      return {
        and: [
          { id: { equals: id } },
          { uploadedBy: { equals: user.id } },
        ],
      }
    },
    // Users can delete their own files
    delete: ({ req: { user }, id }) => {
      if (!user) return false
      // Admin can delete all files
      if (user?.collection === 'admin-users') return true
      // Regular users can only delete their own files
      return {
        and: [
          { id: { equals: id } },
          { uploadedBy: { equals: user.id } },
        ],
      }
    },
  },
  fields: [
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'app-users',
      required: true,
      admin: {
        readOnly: true,
      },
    },
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
    limits: {
      fileSize: 52428800, // 50MB in bytes
    },
  },
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Auto-assign uploadedBy to current user on create
        if (operation === 'create' && req.user && req.user.collection === 'app-users') {
          data.uploadedBy = req.user.id
        }
        return data
      },
    ],
  },
}

import type { CollectionConfig } from 'payload'

export const ProfilePictures: CollectionConfig = {
  slug: 'profile-pictures',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'uploadedBy', 'createdAt'],
    hidden: true, // Hide from admin nav, users will upload via their profile
  },
  access: {
    // Users can only read their own profile pictures
    read: ({ req: { user } }) => {
      if (!user) return false
      // Admin can read all profile pictures
      if (user?.collection === 'admin-users') return true
      // Regular users can only read their own profile pictures
      return {
        uploadedBy: { equals: user.id },
      }
    },
    // Users can create profile pictures for themselves
    create: ({ req: { user } }) => {
      if (!user) return false
      // Only allow authenticated app users to create profile pictures
      return user?.collection === 'app-users'
    },
    // Users can update their own profile pictures
    update: ({ req: { user }, id }) => {
      if (!user) return false
      // Admin can update all profile pictures
      if (user?.collection === 'admin-users') return true
      // Regular users can only update their own profile pictures
      return {
        and: [
          { id: { equals: id } },
          { uploadedBy: { equals: user.id } },
        ],
      }
    },
    // Users can delete their own profile pictures
    delete: ({ req: { user }, id }) => {
      if (!user) return false
      // Admin can delete all profile pictures
      if (user?.collection === 'admin-users') return true
      // Regular users can only delete their own profile pictures
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
  ],
  upload: {
    // Only allow image formats for profile pictures
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 400,
        position: 'centre',
        crop: true,
      },
      {
        name: 'small',
        width: 200,
        height: 200,
        position: 'centre',
        crop: true,
      },
    ],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    crop: true,
    // Max file size: 5MB
    limits: {
      fileSize: 5242880, // 5MB in bytes
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

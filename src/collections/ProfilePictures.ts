import type { CollectionConfig, AccessArgs } from 'payload'

export const ProfilePictures: CollectionConfig = {
  slug: 'profile-pictures',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'uploadedBy', 'createdAt'],
    hidden: true, // Hide from admin nav, users will upload via their profile
  },
  access: {
    // Allow authenticated users to read profile pictures
    // This is needed because:
    // 1. File URLs are accessed separately from document access
    // 2. Session cookies need to be properly sent with image requests
    // 3. Users should only see their own profile pictures in listings
    read: ({ req: { user } }) => {
      if (!user) return false
      // Any authenticated user can read profile picture files
      // But listings are still restricted to own pictures via query constraint below
      if (user?.collection === 'admin-users') return true
      if (user?.collection === 'app-users' || !user?.collection) return true
      return false
    },
    // Users can create profile pictures for themselves
    create: async ({ req }) => {
      const { user } = req
      if (!user) return false
      // Admin can create profile pictures
      if (user?.collection === 'admin-users') return true
      // App users can create profile pictures (collection may not be set by auth plugin)
      if (user?.collection === 'app-users' || !user?.collection) {
        return true
      }
      return false
    },
    // Users can update their own profile pictures
    update: async ({ req: { user }, id }: AccessArgs) => {
      if (!user || !id) return false
      if (user?.collection === 'admin-users') return true
      // App users can update their own profile pictures
      if (user?.collection === 'app-users' || !user?.collection) {
        return {
          uploadedBy: { equals: user.id },
        }
      }
      return false
    },
    // Users can delete their own profile pictures
    delete: async ({ req: { user }, id }: AccessArgs) => {
      if (!user || !id) return false
      if (user?.collection === 'admin-users') return true
      // App users can delete their own profile pictures
      if (user?.collection === 'app-users' || !user?.collection) {
        return {
          uploadedBy: { equals: user.id },
        }
      }
      return false
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
      hooks: {
        beforeValidate: [
          ({ value, req, operation }) => {
            // Auto-set uploadedBy on create
            if (operation === 'create' && !value && req.user?.id) {
              const { user } = req
              // Set for app users (collection may not be set by auth plugin)
              // Check if NOT admin user (admin users have collection set to 'admin-users')
              if (user.collection !== 'admin-users') {
                return user.id
              }
            }
            return value
          },
        ],
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
      },
      {
        name: 'small',
        width: 200,
        height: 200,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    crop: true,
  },
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create' && req.user?.id) {
          if (!data) {
            return { uploadedBy: req.user.id }
          }
          if (!data.uploadedBy) {
            data.uploadedBy = req.user.id
          }
        }
        return data
      },
    ],
  },
}

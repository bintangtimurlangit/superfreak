import type { CollectionConfig, AccessArgs } from 'payload'

export const ProfilePictures: CollectionConfig = {
  slug: 'profile-pictures',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'createdAt'],
    hidden: true, // Hide from admin nav, users will upload via their profile
  },
  access: {
    // Allow anyone to read profile pictures (they're referenced in public user profiles)
    read: () => true,
    // Allow anyone to create (we'll handle auth via hooks)
    create: () => true,
    // Allow anyone to update (we'll handle auth via hooks)
    update: () => true,
    // Allow anyone to delete (we'll handle auth via hooks)
    delete: () => true,
  },
  fields: [],
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
}

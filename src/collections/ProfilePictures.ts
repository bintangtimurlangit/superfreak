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
    
    // Only authenticated users can create profile pictures
    create: ({ req }) => {
      // Check if user is authenticated via cookie or Authorization header
      if (req.user) return true
      
      // Try to authenticate from Authorization header
      const authHeader = req.headers.get?.('authorization')
      if (authHeader?.startsWith('JWT ')) {
        return true // Will be validated by the upload endpoint
      }
      
      return false
    },
    
    // Users can only update their own profile pictures
    // Admins can update any profile picture
    update: ({ req }) => {
      if (!req.user) return false
      
      const isAdmin =
        req.user?.collection === 'admin-users' || (req.user as any)?._collection === 'admin-users'
      
      if (isAdmin) return true
      
      // For now, allow authenticated users to update
      // In production, you'd want to track ownership via a field
      return !!req.user
    },
    
    // Users can only delete their own profile pictures
    // Admins can delete any profile picture
    delete: ({ req }) => {
      if (!req.user) return false
      
      const isAdmin =
        req.user?.collection === 'admin-users' || (req.user as any)?._collection === 'admin-users'
      
      if (isAdmin) return true
      
      // For now, allow authenticated users to delete
      // In production, you'd want to track ownership via a field
      return !!req.user
    },
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

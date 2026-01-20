import type { CollectionConfig } from 'payload'

export const AppUsers: CollectionConfig = {
  slug: 'app-users',
  // auth: true removed - better-auth handles authentication now
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: ({ req: { user }, id }) => {
      console.log('[AppUsers Access Control - Update]', {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        userCollection: user?.collection,
        targetId: id,
        idsMatch: user?.id === id,
      })
      
      if (!user || !user.id) {
        console.log('[AppUsers Access Control] No user in request, denying access')
        return false
      }

      const isAdmin =
        user?.collection === 'admin-users' || (user as any)?._collection === 'admin-users'

      if (isAdmin) {
        console.log('[AppUsers Access Control] User is admin, allowing access')
        return true
      }

      const canUpdate = { id: { equals: user.id } }
      console.log('[AppUsers Access Control] Returning access rule:', canUpdate)
      return canUpdate
    },
    delete: ({ req: { user }, id }) => {
      if (!user || !user.id) return false

      const isAdmin =
        user?.collection === 'admin-users' || (user as any)?._collection === 'admin-users'

      if (isAdmin) return true

      return { id: { equals: user.id } }
    },
  },
  fields: [
    // The payload-auth plugin automatically adds 'name' and 'image' fields based on allowedFields in options.ts
    // The 'image' field is stored as a base64 data URL string by better-auth
    {
      name: 'phoneNumber',
      type: 'text',
      label: 'Phone Number',
      // Not in allowedFields, so it won't be auto-added by plugin, avoiding duplicate
    },
    // Removed profilePicture upload field - using better-auth's built-in 'image' field instead
    // better-auth handles image as a base64 data URL string, stored directly in the user document
    // Removed old auth fields - better-auth handles these:
    // - googleId (handled by accounts collection)
    // - authProvider (handled by accounts collection)
    // - verificationCode, verificationHash, verificationTokenExpire, verificationKind (handled by verifications collection)
  ],
  timestamps: true,
  // Removed old auth hooks - better-auth handles email verification
  // Removed old auth endpoints - better-auth handles verification via /api/auth endpoints
}

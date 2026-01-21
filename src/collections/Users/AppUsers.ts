import type { CollectionConfig } from 'payload'

export const AppUsers: CollectionConfig = {
  slug: 'app-users',
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
    {
      name: 'phoneNumber',
      type: 'text',
      label: 'Phone Number',
    },
  ],
  timestamps: true,
}

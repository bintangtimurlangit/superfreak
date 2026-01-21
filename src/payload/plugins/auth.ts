import { betterAuthPlugin } from 'payload-auth/better-auth'
import { betterAuthPluginOptions } from '@/lib/auth/options'
import type { Plugin } from 'payload'

export const payloadAuth = (): Plugin => {
  const betterAuth = betterAuthPlugin(betterAuthPluginOptions)

  return (config) => {
    const modifiedConfig = betterAuth(config)

    // Only modify accounts collection to show it and allow admin access
    if (modifiedConfig.collections) {
      modifiedConfig.collections = modifiedConfig.collections.map((collection) => {
        if (collection.slug === 'accounts') {
          return {
            ...collection,
            access: {
              ...collection.access,
              read: ({ req: { user } }) => {
                if (!user) return false
                // Check if user has admin role (from better-auth)
                const userRole = (user as any)?.role
                return Array.isArray(userRole) ? userRole.includes('admin') : userRole === 'admin'
              },
            },
            admin: {
              ...collection.admin,
              hidden: false,
            },
          }
        }
        // Add phoneNumber field and access control to app-users collection
        if (collection.slug === 'app-users') {
          return {
            ...collection,
            admin: {
              ...collection.admin,
              useAsTitle: 'email',
              defaultColumns: ['email', 'name', 'createdAt'],
            },
            access: {
              read: () => true,
              create: () => true,
              update: ({ req: { user }, id }) => {
                if (!user || !user.id) return false
                // Check if user has admin role (from better-auth)
                const userRole = (user as any)?.role
                const isAdmin = Array.isArray(userRole) ? userRole.includes('admin') : userRole === 'admin'
                if (isAdmin) return true
                return { id: { equals: user.id } }
              },
              delete: ({ req: { user }, id }) => {
                if (!user || !user.id) return false
                // Check if user has admin role (from better-auth)
                const userRole = (user as any)?.role
                const isAdmin = Array.isArray(userRole) ? userRole.includes('admin') : userRole === 'admin'
                if (isAdmin) return true
                return { id: { equals: user.id } }
              },
            },
            fields: [
              ...(collection.fields || []),
              {
                name: 'phoneNumber',
                type: 'text',
                label: 'Phone Number',
              },
            ],
          }
        }
        return collection
      })
    }

    return modifiedConfig
  }
}

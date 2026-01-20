import { betterAuthPlugin } from 'payload-auth/better-auth'
import { betterAuthPluginOptions } from '@/lib/auth/options'
import type { Plugin } from 'payload'

export const payloadAuth = (): Plugin => {
  const betterAuth = betterAuthPlugin(betterAuthPluginOptions)
  
  return (config) => {
    // First apply the better-auth plugin
    const modifiedConfig = betterAuth(config)
    
    // Then modify the accounts collection to allow admin reads
    if (modifiedConfig.collections) {
      modifiedConfig.collections = modifiedConfig.collections.map((collection) => {
        if (collection.slug === 'accounts') {
          return {
            ...collection,
            access: {
              ...collection.access,
              read: ({ req: { user } }) => {
                // Allow admins to read accounts
                if (!user) return false
                const isAdmin = user?.collection === 'admin-users' || (user as any)?._collection === 'admin-users'
                return isAdmin
              },
            },
            admin: {
              ...collection.admin,
              hidden: false, // Ensure it's visible
            },
          }
        }
        return collection
      })
    }
    
    return modifiedConfig
  }
}

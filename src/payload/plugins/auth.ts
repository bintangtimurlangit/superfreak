import { betterAuthPlugin } from 'payload-auth/better-auth'
import { betterAuthPluginOptions } from '@/lib/auth/options'
import type { Plugin } from 'payload'

export const payloadAuth = (): Plugin => {
  const betterAuth = betterAuthPlugin(betterAuthPluginOptions)

  return (config) => {
    const modifiedConfig = betterAuth(config)

    if (modifiedConfig.collections) {
      modifiedConfig.collections = modifiedConfig.collections.map((collection) => {
        if (collection.slug === 'accounts') {
          return {
            ...collection,
            access: {
              ...collection.access,
              read: ({ req: { user } }) => {
                if (!user) return false
                const isAdmin =
                  user?.collection === 'admin-users' || (user as any)?._collection === 'admin-users'
                return isAdmin
              },
            },
            admin: {
              ...collection.admin,
              hidden: false,
            },
          }
        }
        return collection
      })
    }

    return modifiedConfig
  }
}

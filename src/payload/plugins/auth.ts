import { betterAuthPlugin } from 'payload-auth/better-auth'
import { betterAuthPluginOptions } from '@/lib/auth/options'

export const payloadAuth = () => {
  try {
    console.log('[Payload Auth Plugin] Initializing with options:', {
      disabled: betterAuthPluginOptions.disabled,
      usersSlug: betterAuthPluginOptions.users.slug,
      hasBetterAuthOptions: !!betterAuthPluginOptions.betterAuthOptions
    })
    const plugin = betterAuthPlugin(betterAuthPluginOptions)
    console.log('[Payload Auth Plugin] Plugin created successfully')
    return plugin
  } catch (error) {
    console.error('[Payload Auth Plugin] Error initializing plugin:', error)
    throw error
  }
}

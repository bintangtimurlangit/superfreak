import { toNextJsHandler } from 'better-auth/next-js'
import { getPayload } from '@/lib/payload'
import { withApiLogger } from '@/lib/api-logger'

let authHandler: ReturnType<typeof toNextJsHandler> | null = null

async function initAuthHandler() {
  if (!authHandler) {
    try {
      const payload = await getPayload()

      if (!payload || !('betterAuth' in payload)) {
        console.error('Payload instance:', Object.keys(payload || {}))
        throw new Error(
          'betterAuth property not found on payload instance. Check plugin configuration.',
        )
      }

      if (!payload.betterAuth) {
        throw new Error(
          'betterAuth is undefined. Make sure the betterAuthPlugin is properly configured in payload.config.ts',
        )
      }

      authHandler = toNextJsHandler(payload.betterAuth)
    } catch (error) {
      console.error('Error initializing auth handler:', error)
      throw error
    }
  }
  return authHandler
}

const handlerPromise = initAuthHandler()

async function postHandler(request: Request) {
  try {
    const handler = await handlerPromise
    return handler.POST(request)
  } catch (error) {
    console.error('Auth POST error:', error)
    return new Response(JSON.stringify({ error: 'Authentication service unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function getHandler(request: Request) {
  try {
    const handler = await handlerPromise
    return handler.GET(request)
  } catch (error) {
    console.error('Auth GET error:', error)
    return new Response(JSON.stringify({ error: 'Authentication service unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const POST = withApiLogger(postHandler)
export const GET = withApiLogger(getHandler)

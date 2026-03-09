import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'
import { getRedis, getOrderMessagesChannel } from '@/lib/redis'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: orderId } = await params

  const payload = await getPayload()
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const order = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 0,
    req: { user, payload, headers: requestHeaders } as any,
    overrideAccess: false,
  })
  if (!order) {
    return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 })
  }

  const channel = getOrderMessagesChannel(orderId)
  const redis = getRedis().duplicate()

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (e) {
          // stream may be closed
        }
      }

      redis.subscribe(channel, (err) => {
        if (err) {
          send({ error: 'Subscribe failed' })
          controller.close()
          return
        }
      })

      redis.on('message', (_ch, message) => {
        try {
          const data = JSON.parse(message)
          send(data)
        } catch {
          send({ raw: message })
        }
      })

      request.signal.addEventListener('abort', () => {
        redis.unsubscribe(channel)
        redis.quit().catch(() => {})
        try {
          controller.close()
        } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Connection: 'keep-alive',
    },
  })
}

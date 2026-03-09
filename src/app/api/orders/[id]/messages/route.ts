import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'
import { withApiLogger } from '@/lib/api-logger'
import { publishOrderMessage } from '@/lib/redis'

async function getAuthAndOrder(orderId: string) {
  const payload = await getPayload()
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const order = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 0,
    req: { user, payload, headers: requestHeaders } as any,
    overrideAccess: false,
  })
  if (!order) return { error: NextResponse.json({ error: 'Order not found' }, { status: 404 }) }

  return { payload, requestHeaders, user, order }
}

export const GET = withApiLogger(async function getOrderMessages(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<{ docs: unknown[] } | { error: string; details?: string }>> {
  try {
    const { id: orderId } = await params
    const result = await getAuthAndOrder(orderId)
    if ('error' in result) return result.error as NextResponse<{ error: string }>

    const { payload, requestHeaders, user } = result

    const { docs } = await payload.find({
      collection: 'order-messages',
      where: { order: { equals: orderId } },
      sort: 'createdAt',
      depth: 1,
      limit: 200,
      req: { user, payload, headers: requestHeaders } as any,
      overrideAccess: false,
    })

    return NextResponse.json({ docs })
  } catch (error) {
    console.error('Error fetching order messages:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch messages',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
})

export const POST = withApiLogger(async function postOrderMessage(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<unknown>> {
  try {
    const { id: orderId } = await params
    const result = await getAuthAndOrder(orderId)
    if ('error' in result) return result.error as NextResponse<{ error: string }>

    const { payload, requestHeaders, user, order } = result

    if (order.status !== 'needs-discussion') {
      return NextResponse.json(
        { error: 'Discussion is only allowed when order status is needs-discussion' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const messageBody = typeof body?.body === 'string' ? body.body.trim() : ''
    if (!messageBody) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 })
    }

    const doc = await payload.create({
      collection: 'order-messages',
      data: {
        order: orderId,
        author: user.id,
        body: messageBody,
      },
      req: { user, payload, headers: requestHeaders } as any,
      overrideAccess: false,
    })

    // Hook already publishes to Redis; optionally publish here too so API-created messages are consistent
    await publishOrderMessage(orderId, {
      id: doc.id,
      order: orderId,
      author: doc.author,
      body: doc.body,
      createdAt: doc.createdAt,
    })

    return NextResponse.json(doc)
  } catch (error) {
    console.error('Error creating order message:', error)
    return NextResponse.json(
      {
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
})

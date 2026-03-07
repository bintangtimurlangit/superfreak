import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'
import { withApiLogger } from '@/lib/api-logger'

const CANCELABLE_STATUSES = ['unpaid', 'in-review', 'needs-discussion']

export const POST = withApiLogger(async function cancelOrder(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = await getPayload()
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const order = await payload.findByID({
      collection: 'orders',
      id,
      depth: 0,
      req: {
        user,
        payload,
        headers: requestHeaders,
      } as any,
      overrideAccess: false,
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const status = typeof order.status === 'string' ? order.status : (order as any).status
    if (!CANCELABLE_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: 'Order cannot be canceled',
          details: `Only orders with status unpaid, in-review, or needs-discussion can be canceled. Current status: ${status}`,
        },
        { status: 400 },
      )
    }

    const updatedOrder = await payload.update({
      collection: 'orders',
      id,
      data: { status: 'canceled' },
      req: {
        user,
        payload,
        headers: requestHeaders,
      } as any,
      overrideAccess: true,
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error canceling order:', error)
    return NextResponse.json(
      {
        error: 'Failed to cancel order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
})

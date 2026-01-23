import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getPayload()
    const requestHeaders = await headers()

    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get the order and verify it belongs to the user
    const order = await payload.findByID({
      collection: 'orders',
      id,
      req: {
        user,
        payload,
        headers: requestHeaders,
      } as any,
      overrideAccess: false, // Enforce access control
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

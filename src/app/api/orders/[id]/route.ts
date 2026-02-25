import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'
import { withApiLogger } from '@/lib/api-logger'

export const GET = withApiLogger(async function getOrder(
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
})

export const PATCH = withApiLogger(async function updateOrder(
  request: Request,
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

    // Parse FormData (Payload admin panel sends multipart/form-data)
    const formData = await request.formData()
    const payloadData = formData.get('_payload')

    if (!payloadData || typeof payloadData !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: 'Expected _payload field in form data',
        },
        { status: 400 },
      )
    }

    let data
    try {
      data = JSON.parse(payloadData)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Payload data:', payloadData)
      return NextResponse.json(
        {
          error: 'Invalid JSON in _payload field',
          details: parseError instanceof Error ? parseError.message : 'Unknown error',
        },
        { status: 400 },
      )
    }

    console.log('Updating order with data:', data)

    // Update the order using Payload's Local API
    const updatedOrder = await payload.update({
      collection: 'orders',
      id,
      data,
      req: {
        user,
        payload,
        headers: requestHeaders,
      } as any,
      overrideAccess: false, // Enforce access control (admin only can update)
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      {
        error: 'Failed to update order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
})

export const DELETE = withApiLogger(async function deleteOrder(
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

    // Delete the order using Payload's Local API
    await payload.delete({
      collection: 'orders',
      id,
      req: {
        user,
        payload,
        headers: requestHeaders,
      } as any,
      overrideAccess: false, // Enforce access control (admin only can delete)
    })

    return NextResponse.json({ success: true, message: 'Order deleted successfully' })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
})

import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'
import { NextRequest } from 'next/server'

export async function GET() {
  try {
    const payload = await getPayload()
    const requestHeaders = await headers()

    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orders = await payload.find({
      collection: 'orders',
      where: {
        user: {
          equals: user.id,
        },
      },
      sort: '-createdAt',
      limit: 100,
      req: {
        user,
        payload,
        headers: requestHeaders,
      } as any,
      overrideAccess: false,
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload()
    const requestHeaders = await headers()

    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Create the order
    const order = await payload.create({
      collection: 'orders',
      data: {
        ...body,
        user: user.id, // Ensure user is set from authenticated session
      },
      req: {
        user,
        payload,
        headers: requestHeaders,
      } as any,
      overrideAccess: false,
    })

    return NextResponse.json(order)
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      {
        error: 'Failed to create order',
        details: error.message || 'Unknown error',
        errors: error.data || [],
      },
      { status: 500 },
    )
  }
}

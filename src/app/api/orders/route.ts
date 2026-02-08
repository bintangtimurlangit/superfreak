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

export async function DELETE(request: NextRequest) {
  try {
    const payload = await getPayload()
    const requestHeaders = await headers()

    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse the query parameters to get the where clause
    const url = new URL(request.url)
    const searchParams = url.searchParams

    // Extract all id parameters from query string
    // The admin panel sends: where[and][0][id][in][0]=id1&where[and][0][id][in][1]=id2...
    const ids: string[] = []
    searchParams.forEach((value, key) => {
      if (key.includes('[id][in]')) {
        ids.push(value)
      }
    })

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No order IDs provided' }, { status: 400 })
    }

    // Delete orders using Payload's Local API
    const result = await payload.delete({
      collection: 'orders',
      where: {
        id: {
          in: ids,
        },
      },
      req: {
        user,
        payload,
        headers: requestHeaders,
      } as any,
      overrideAccess: false, // Enforce access control (admin only can delete)
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error deleting orders:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete orders',
        details: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'
import { withApiLogger } from '@/lib/api-logger'
import type { CartItem } from '@/lib/cart'

export const GET = withApiLogger(async function getCart() {
  try {
    const payload = await getPayload()
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return NextResponse.json({ items: [] })
    }

    const result = await payload.find({
      collection: 'carts',
      where: { user: { equals: user.id } },
      limit: 1,
      depth: 0,
      req: { user, payload, headers: requestHeaders } as any,
      overrideAccess: false,
    })

    const cart = result.docs[0]
    const items = Array.isArray(cart?.items) ? (cart.items as CartItem[]) : []
    return NextResponse.json({ items })
  } catch (error) {
    console.error('[API /api/cart GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
})

export const PUT = withApiLogger(async function setCart(request: NextRequest) {
  try {
    const payload = await getPayload()
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const items = Array.isArray(body?.items) ? body.items : []

    const existing = await payload.find({
      collection: 'carts',
      where: { user: { equals: user.id } },
      limit: 1,
      depth: 0,
      req: { user, payload, headers: requestHeaders } as any,
      overrideAccess: false,
    })

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'carts',
        id: existing.docs[0].id,
        data: { items },
        req: { user, payload, headers: requestHeaders } as any,
        overrideAccess: false,
      })
    } else {
      await payload.create({
        collection: 'carts',
        data: { user: user.id, items },
        req: { user, payload, headers: requestHeaders } as any,
        overrideAccess: false,
      })
    }

    return NextResponse.json({ items })
  } catch (error) {
    console.error('[API /api/cart PUT]', error)
    return NextResponse.json(
      { error: 'Failed to update cart', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
})

export const DELETE = withApiLogger(async function clearCart() {
  try {
    const payload = await getPayload()
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await payload.find({
      collection: 'carts',
      where: { user: { equals: user.id } },
      limit: 1,
      depth: 0,
      req: { user, payload, headers: requestHeaders } as any,
      overrideAccess: false,
    })

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'carts',
        id: existing.docs[0].id,
        data: { items: [] },
        req: { user, payload, headers: requestHeaders } as any,
        overrideAccess: false,
      })
    }

    return NextResponse.json({ items: [] })
  } catch (error) {
    console.error('[API /api/cart DELETE]', error)
    return NextResponse.json(
      { error: 'Failed to clear cart', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
})

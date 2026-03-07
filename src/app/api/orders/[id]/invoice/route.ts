import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'
import { buildInvoicePdf } from '@/lib/invoice/buildInvoicePdf'
import type { Order } from '@/payload-types'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const payload = await getPayload()
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const order = await payload.findByID({
      collection: 'orders',
      id,
      depth: 0,
      req: { user, payload, headers: requestHeaders } as unknown as import('payload').PayloadRequest,
      overrideAccess: false,
    }) as Order | null

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const pdfBytes = buildInvoicePdf(order)
    const filename = `invoice-${order.orderNumber ?? order.id}.pdf`

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBytes.length),
      },
    })
  } catch (error) {
    console.error('Invoice generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate invoice',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

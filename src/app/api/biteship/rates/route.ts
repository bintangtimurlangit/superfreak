import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { withApiLogger } from '@/lib/api-logger'

const BITESHIP_API_URL = 'https://api.biteship.com/v1/rates/couriers'

interface BiteshipPricingItem {
  courier_name?: string
  courier_code?: string
  courier_service_name?: string
  courier_service_code?: string
  description?: string
  price?: number
  shipping_fee?: number
  duration?: string
  shipment_duration_range?: string
  shipment_duration_unit?: string
}

export const POST = withApiLogger(async function biteshipRates(req: NextRequest) {
  try {
    const body = await req.json()
    const { destinationPostalCode, weight, courier } = body

    if (!destinationPostalCode || !weight || !courier) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'destinationPostalCode, weight, and courier are required',
        },
        { status: 400 },
      )
    }

    const apiKey = process.env.BITESHIP_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Biteship API key not configured. Set BITESHIP_API_KEY in env.' },
        { status: 500 },
      )
    }

    const payload = await getPayload()
    const courierSettings = await payload.findGlobal({ slug: 'courier-settings' })
    const settings = courierSettings as { warehousePostalCode?: string } | null
    const originPostalCode =
      settings?.warehousePostalCode || process.env.BITESHIP_ORIGIN_POSTAL_CODE || '12440'

    const adjustedWeight = weight < 300 ? weight + 300 : weight

    const response = await fetch(BITESHIP_API_URL, {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin_postal_code: Number(String(originPostalCode).replace(/\D/g, '')) || 12440,
        destination_postal_code: Number(String(destinationPostalCode).replace(/\D/g, '')),
        couriers: courier,
        items: [
          {
            name: 'Order',
            value: 0,
            quantity: 1,
            weight: adjustedWeight,
          },
        ],
      }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const message = data?.message || data?.error || response.statusText
      console.error('Biteship API Error:', { status: response.status, message, data })
      return NextResponse.json(
        {
          error: 'Biteship API request failed',
          details: message,
          status: response.status,
        },
        { status: response.status },
      )
    }

    if (!data.pricing || !Array.isArray(data.pricing)) {
      return NextResponse.json(
        { error: 'Invalid Biteship response', details: 'No pricing array' },
        { status: 502 },
      )
    }

    const dataFormatted = (data.pricing as BiteshipPricingItem[]).map((p) => {
      const etd =
        p.duration ||
        (p.shipment_duration_range
          ? `${p.shipment_duration_range} ${p.shipment_duration_unit || 'days'}`
          : '')
      return {
        name: p.courier_name || p.courier_code || '',
        code: p.courier_service_code || p.courier_code || '',
        service: p.courier_service_name || p.courier_service_code || p.courier_code || '',
        description: p.description || '',
        cost: p.price ?? p.shipping_fee ?? 0,
        etd: etd || '-',
      }
    })

    return NextResponse.json({
      meta: { message: 'Success', code: 200, status: 'success' },
      data: dataFormatted,
    })
  } catch (error) {
    console.error('Biteship rates error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get shipping rates',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
})

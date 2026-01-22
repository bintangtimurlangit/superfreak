import { getCachedShippingCost, setCachedShippingCost } from '@/lib/redis'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { destinationId, weight, courier } = body

    // Validation
    if (!destinationId || !weight || !courier) {
      return Response.json(
        {
          error: 'Missing required fields',
          details: 'destinationId, weight, and courier are required',
        },
        { status: 400 },
      )
    }

    const apiKey = process.env.RAJAONGKIR_SHIPPING_COST_API

    if (!apiKey) {
      return Response.json({ error: 'RajaOngkir API key not configured' }, { status: 500 })
    }

    // Get warehouse settings from Payload
    const { getPayload } = await import('payload')
    const config = await import('@payload-config')
    const payload = await getPayload({ config: config.default })

    const courierSettings = await payload.findGlobal({
      slug: 'courier-settings',
    })

    const warehouseId = courierSettings?.warehouseId || 73633

    // Apply weight offset: if weight < 300, add 300g for packaging
    const adjustedWeight = weight < 300 ? weight + 300 : weight

    // Check Redis cache first
    const cachedResult = await getCachedShippingCost(
      warehouseId.toString(),
      destinationId.toString(),
      adjustedWeight,
      courier,
    )

    if (cachedResult) {
      console.log('Shipping cost from cache:', {
        origin: warehouseId,
        destination: destinationId,
        weight: adjustedWeight,
        courier,
      })
      return Response.json(cachedResult)
    }

    console.log('Calculating shipping cost (cache miss):', {
      origin: warehouseId,
      destination: destinationId,
      originalWeight: weight,
      adjustedWeight,
      courier,
    })

    // Prepare form data (application/x-www-form-urlencoded)
    const formData = new URLSearchParams({
      origin: warehouseId.toString(),
      destination: destinationId.toString(),
      weight: adjustedWeight.toString(),
      courier: courier,
    })

    // Call RajaOngkir Cost API with correct endpoint
    const response = await fetch('https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost', {
      method: 'POST',
      headers: {
        key: apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('RajaOngkir Cost API Error:', {
        status: response.status,
        error: errorText,
      })
      return Response.json(
        {
          error: 'RajaOngkir API request failed',
          details: errorText,
          status: response.status,
        },
        { status: response.status },
      )
    }

    const data = await response.json()

    console.log('RajaOngkir Cost Response:', {
      courier,
      servicesCount: data.data?.costs?.length || 0,
      meta: data.meta,
    })

    // Cache the result for 24 hours (86400 seconds)
    await setCachedShippingCost(
      warehouseId.toString(),
      destinationId.toString(),
      adjustedWeight,
      courier,
      data,
      86400,
    )

    console.log('Cached shipping cost for 24 hours')

    return Response.json(data)
  } catch (error) {
    console.error('Shipping cost calculation error:', error)
    return Response.json(
      {
        error: 'Failed to calculate shipping cost',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

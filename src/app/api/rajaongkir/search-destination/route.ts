import { withApiLogger } from '@/lib/api-logger'

export const GET = withApiLogger(async function searchDestination(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const limit = searchParams.get('limit') || '20'
  const offset = searchParams.get('offset') || '0'

  if (!query) {
    return Response.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  const apiKey = process.env.RAJAONGKIR_SHIPPING_COST_API

  if (!apiKey) {
    return Response.json({ error: 'RajaOngkir API key not configured' }, { status: 500 })
  }

  try {
    const url = `https://rajaongkir.komerce.id/api/v1/destination/domestic-destination?search=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`

    console.log('RajaOngkir Search:', {
      query,
      url,
    })

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        key: apiKey,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('RajaOngkir API Error:', {
        status: response.status,
        statusText: response.statusText,
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

    console.log('RajaOngkir Response:', {
      query,
      resultsCount: data.data?.length || 0,
      meta: data.meta,
    })

    return Response.json(data)
  } catch (error) {
    console.error('RajaOngkir search error:', error)
    return Response.json(
      {
        error: 'Failed to search location',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
})

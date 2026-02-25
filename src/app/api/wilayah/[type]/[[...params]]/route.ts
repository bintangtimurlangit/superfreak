import { cacheGet, cacheSet } from '@/lib/redis'
import { withApiLogger } from '@/lib/api-logger'

export const GET = withApiLogger(async function getWilayah(
  request: Request,
  props: { params: Promise<{ type: string; params?: string[] }> },
) {
  const { type, params } = await props.params

  const validTypes = ['provinces', 'regencies', 'districts', 'villages']
  if (!validTypes.includes(type)) {
    return Response.json(
      { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
      { status: 400 },
    )
  }

  try {
    let url: string
    let cacheKey: string

    if (type === 'provinces') {
      url = 'https://wilayah.id/api/provinces.json'
      cacheKey = 'wilayah:provinces'
    } else {
      const code = params?.[0]

      if (!code) {
        return Response.json({ error: `Code parameter is required for ${type}` }, { status: 400 })
      }

      url = `https://wilayah.id/api/${type}/${code}.json`
      cacheKey = `wilayah:${type}:${code}`
    }

    const cachedData = await cacheGet(cacheKey)
    if (cachedData) {
      console.log(`Wilayah ${type} from cache`)
      return Response.json(cachedData)
    }

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return Response.json({ error: `Failed to fetch ${type}` }, { status: response.status })
    }

    const result = await response.json()
    const data = result.data || result

    await cacheSet(cacheKey, data, 2592000)
    console.log(`Cached wilayah ${type} for 30 days`)

    return Response.json(data)
  } catch (error) {
    console.error(`Error fetching ${type}:`, error)
    return Response.json({ error: `Failed to fetch ${type}` }, { status: 500 })
  }
})

export async function GET(
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

    if (type === 'provinces') {
      url = 'https://wilayah.id/api/provinces.json'
    } else {
      const code = params?.[0]

      if (!code) {
        return Response.json({ error: `Code parameter is required for ${type}` }, { status: 400 })
      }

      url = `https://wilayah.id/api/${type}/${code}.json`
    }

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 86400 },
    })

    if (!response.ok) {
      return Response.json({ error: `Failed to fetch ${type}` }, { status: response.status })
    }

    const result = await response.json()
    return Response.json(result.data || result)
  } catch (error) {
    console.error(`Error fetching ${type}:`, error)
    return Response.json({ error: `Failed to fetch ${type}` }, { status: 500 })
  }
}

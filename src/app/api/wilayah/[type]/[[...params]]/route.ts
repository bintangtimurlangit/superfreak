export async function GET(
  request: Request,
  props: { params: Promise<{ type: string; params?: string[] }> }
) {
  const { type, params } = await props.params

  // Validate type
  const validTypes = ['provinces', 'regencies', 'districts', 'villages']
  if (!validTypes.includes(type)) {
    return Response.json(
      { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    // Build URL based on type
    let url: string
    
    if (type === 'provinces') {
      // Provinces don't need a code parameter
      url = 'https://wilayah.id/api/provinces.json'
    } else {
      // Other types need a code parameter
      const code = params?.[0]
      
      if (!code) {
        return Response.json(
          { error: `Code parameter is required for ${type}` },
          { status: 400 }
        )
      }
      
      url = `https://wilayah.id/api/${type}/${code}.json`
    }

    // Fetch data from wilayah.id API
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      // Add caching for better performance
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    if (!response.ok) {
      return Response.json(
        { error: `Failed to fetch ${type}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    return Response.json(result.data || result)
  } catch (error) {
    console.error(`Error fetching ${type}:`, error)
    return Response.json(
      { error: `Failed to fetch ${type}` },
      { status: 500 }
    )
  }
}

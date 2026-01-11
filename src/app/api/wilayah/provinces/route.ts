export async function GET() {
  try {
    const response = await fetch('https://wilayah.id/api/provinces.json', {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return Response.json({ error: 'Failed to fetch provinces' }, { status: response.status })
    }

    const result = await response.json()
    return Response.json(result.data || result)
  } catch (error) {
    console.error('Error fetching provinces:', error)
    return Response.json({ error: 'Failed to fetch provinces' }, { status: 500 })
  }
}

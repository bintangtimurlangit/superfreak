export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const response = await fetch(`https://wilayah.id/api/districts/${params.code}.json`, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return Response.json({ error: 'Failed to fetch districts' }, { status: response.status })
    }

    const result = await response.json()
    return Response.json(result.data || result)
  } catch (error) {
    console.error('Error fetching districts:', error)
    return Response.json({ error: 'Failed to fetch districts' }, { status: 500 })
  }
}

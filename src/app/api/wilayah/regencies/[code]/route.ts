export async function GET(request: Request, props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  try {
    const response = await fetch(`https://wilayah.id/api/regencies/${params.code}.json`, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return Response.json({ error: 'Failed to fetch regencies' }, { status: response.status })
    }

    const result = await response.json()
    return Response.json(result.data || result)
  } catch (error) {
    console.error('Error fetching regencies:', error)
    return Response.json({ error: 'Failed to fetch regencies' }, { status: 500 })
  }
}

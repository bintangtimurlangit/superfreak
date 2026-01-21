import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params

  try {
    const payload = await getPayload()
    const requestHeaders = await headers()

    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const address = await payload.findByID({
      collection: 'addresses',
      id: params.id,
      req: {
        user,
        payload,
        headers: requestHeaders,
      } as any,
      overrideAccess: false,
    })

    await payload.delete({
      collection: 'addresses',
      id: params.id,
      req: {
        user,
        payload,
        headers: requestHeaders,
      } as any,
      overrideAccess: false,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting address:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete address' },
      { status: 500 },
    )
  }
}

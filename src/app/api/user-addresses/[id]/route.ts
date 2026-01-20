import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  
  try {
    const payload = await getPayload()
    const requestHeaders = await headers()
    
    // Get authenticated user from better-auth session
    const { user } = await payload.auth({ headers: requestHeaders })
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify the address belongs to this user using Payload Local API with access control
    const address = await payload.findByID({
      collection: 'addresses',
      id: params.id,
      req: {
        user,
        payload,
        headers: requestHeaders,
      } as any,
      overrideAccess: false, // Enforce access control - will only return if user owns it
    })
    
    // Delete the address using Payload Local API with access control
    await payload.delete({
      collection: 'addresses',
      id: params.id,
      req: {
        user,
        payload,
        headers: requestHeaders,
      } as any,
      overrideAccess: false, // Enforce access control
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting address:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete address' },
      { status: 500 }
    )
  }
}

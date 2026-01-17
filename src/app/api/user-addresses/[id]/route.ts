import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  
  try {
    const payload = await getPayload({ config })
    
    // Get user from session cookie
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = cookieHeader.split(';').map(c => c.trim())
    const tokenCookie = cookies.find(c => c.startsWith('payload-token-app-users='))
    
    if (!tokenCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = tokenCookie.split('=')[1]
    
    // Verify token manually
    let user = null
    try {
      const jwt = await import('jsonwebtoken')
      const secret = process.env.PAYLOAD_SECRET || ''
      const decoded = jwt.verify(token, secret) as { id: string; collection: string }
      
      if (decoded && decoded.collection === 'app-users') {
        user = { id: decoded.id }
      }
    } catch (e) {
      console.error('Token verification failed:', e)
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify the address belongs to this user
    const address = await payload.findByID({
      collection: 'addresses',
      id: params.id,
      overrideAccess: true,
    })
    
    const addressUserId = typeof address.user === 'string' ? address.user : address.user.id
    
    if (addressUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Delete the address
    await payload.delete({
      collection: 'addresses',
      id: params.id,
      overrideAccess: true,
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

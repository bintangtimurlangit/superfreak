import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
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
    
    // Verify token manually to avoid access control issues
    let user = null
    try {
      const jwt = await import('jsonwebtoken')
      const secret = process.env.PAYLOAD_SECRET || ''
      
      if (!secret) {
        console.error('PAYLOAD_SECRET is not set')
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      }
      
      const decoded = jwt.verify(token, secret) as { id: string; collection: string }
      
      if (decoded && decoded.collection === 'app-users') {
        user = await payload.findByID({
          collection: 'app-users',
          id: decoded.id,
          depth: 0,
        })
      }
    } catch (e) {
      console.error('Token verification failed:', e)
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Fetch addresses for this user
    const addresses = await payload.find({
      collection: 'addresses',
      where: {
        user: {
          equals: user.id,
        },
      },
      overrideAccess: true, // Bypass access control since we already verified the user
    })
    
    return NextResponse.json(addresses)
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    
    const body = await request.json()
    
    // Create address
    const address = await payload.create({
      collection: 'addresses',
      data: {
        ...body,
        user: user.id,
      },
      overrideAccess: true,
    })
    
    return NextResponse.json(address)
  } catch (error: any) {
    console.error('Error creating address:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create address' },
      { status: 500 }
    )
  }
}

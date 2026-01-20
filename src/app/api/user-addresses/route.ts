import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload()
    const requestHeaders = await headers()
    
    // Get authenticated user from better-auth session
    const { user } = await payload.auth({ headers: requestHeaders })
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Fetch addresses for this user using Payload Local API with access control
    const addresses = await payload.find({
      collection: 'addresses',
      where: {
        user: {
          equals: user.id,
        },
      },
      req: {
        user,
        payload,
        headers: requestHeaders,
      } as any,
      overrideAccess: false, // Enforce access control
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
    const payload = await getPayload()
    const requestHeaders = await headers()
    
    // Get authenticated user from better-auth session
    const { user } = await payload.auth({ headers: requestHeaders })
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    
    // Create address using Payload Local API with access control
    const address = await payload.create({
      collection: 'addresses',
      data: {
        ...body,
        user: user.id,
      },
      req: {
        user,
        payload,
        headers: requestHeaders,
      } as any,
      overrideAccess: false, // Enforce access control
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

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import jwt from 'jsonwebtoken'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id: userId } = await params
    
    // Get token from cookie or Authorization header
    let token = request.cookies.get('payload-token-app-users')?.value
    
    if (!token) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('JWT ')) {
        token = authHeader.substring(4)
      }
    }

    if (!token) {
      return NextResponse.json(
        { errors: [{ message: 'Unauthorized' }] },
        { status: 401 }
      )
    }

    const secret = process.env.PAYLOAD_SECRET
    if (!secret) {
      console.error('[Update User] PAYLOAD_SECRET is not configured')
      return NextResponse.json(
        { errors: [{ message: 'Server configuration error' }] },
        { status: 500 }
      )
    }

    // Verify and decode the JWT
    const decoded = jwt.verify(token, secret) as {
      id: string
      email: string
      collection: string
    }

    if (!decoded || !decoded.id || decoded.collection !== 'app-users') {
      return NextResponse.json(
        { errors: [{ message: 'Invalid token' }] },
        { status: 401 }
      )
    }

    // Check if user is trying to update their own profile
    if (decoded.id !== userId) {
      return NextResponse.json(
        { errors: [{ message: 'You can only update your own profile' }] },
        { status: 403 }
      )
    }

    // Get the update data
    const body = await request.json()
    
    // Only allow updating specific fields
    const allowedFields = ['name', 'phoneNumber', 'profilePicture']
    const updateData: Record<string, any> = {}
    
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { errors: [{ message: 'No valid fields to update' }] },
        { status: 400 }
      )
    }

    // Update the user
    const payload = await getPayload({ config })
    const user = await payload.update({
      collection: 'app-users',
      id: userId,
      data: updateData,
    })

    return NextResponse.json({ doc: user })
  } catch (error) {
    console.error('[Update User] Error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { errors: [{ message: 'Invalid token' }] },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { errors: [{ message: 'Failed to update user' }] },
      { status: 500 }
    )
  }
}

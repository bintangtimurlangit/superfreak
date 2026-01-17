import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const cookies = request.cookies
    const token = cookies.get('payload-token-app-users')?.value

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const secret = process.env.PAYLOAD_SECRET
    if (!secret) {
      console.error('[Custom /me] PAYLOAD_SECRET is not configured')
      return NextResponse.json({ user: null }, { status: 500 })
    }

    // Verify and decode the JWT
    const decoded = jwt.verify(token, secret) as {
      id: string
      email: string
      collection: string
    }

    if (!decoded || !decoded.id || decoded.collection !== 'app-users') {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // Get the user from database
    const payload = await getPayload({ config })
    const user = await payload.findByID({
      collection: 'app-users',
      id: decoded.id,
      depth: 0,
    })

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 })
    }

    // Return user in the same format as Payload's /me endpoint
    return NextResponse.json({ user })
  } catch (error) {
    console.error('[Custom /me] Error:', error)
    return NextResponse.json({ user: null }, { status: 401 })
  }
}

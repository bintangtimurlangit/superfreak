import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy for current user's profile image so the browser sends the auth cookie
 * (same-origin request). Forwards to the Nest backend GET /api/users/me/profile-image.
 */
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'

export async function GET(req: NextRequest) {
  try {
    const cookie = req.headers.get('cookie') || ''
    const res = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/users/me/profile-image`, {
      headers: { cookie },
    })

    if (!res.ok) {
      return new NextResponse(null, { status: res.status })
    }

    const contentType = res.headers.get('Content-Type') || 'image/jpeg'
    const cacheControl = res.headers.get('Cache-Control') || 'private, max-age=300'
    const body = await res.arrayBuffer()

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
      },
    })
  } catch (err) {
    console.error('[API /api/users/me/profile-image] Proxy error:', err)
    return new NextResponse(null, { status: 502 })
  }
}

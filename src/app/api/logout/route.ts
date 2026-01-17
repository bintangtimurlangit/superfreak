import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
    
    // Clear all auth-related cookies
    response.cookies.delete('payload-token-app-users')
    response.cookies.delete('app-users-token')
    response.cookies.delete('payload-token')
    
    // Also set them to expire immediately as a fallback
    response.cookies.set('payload-token-app-users', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
      expires: new Date(0),
    })
    
    return response
  } catch (error) {
    console.error('[Logout] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    )
  }
}

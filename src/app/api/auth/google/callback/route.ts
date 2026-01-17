import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { getPayload } from 'payload'
import config from '@payload-config'
import jwt from 'jsonwebtoken'

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/api/auth/google/callback`,
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    console.log('[OAuth Callback] Starting OAuth callback:', {
      hasCode: !!code,
      hasError: !!error,
      error: error || null,
    })

    if (error) {
      console.log('[OAuth Callback] OAuth error received:', error)
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent('Authentication failed')}`, request.url),
      )
    }

    if (!code) {
      console.log('[OAuth Callback] No authorization code received')
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent('No authorization code received')}`, request.url),
      )
    }

    console.log('[OAuth Callback] Exchanging code for tokens...')
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    console.log('[OAuth Callback] Tokens received:', {
      hasAccessToken: !!tokens.access_token,
      hasIdToken: !!tokens.id_token,
      hasRefreshToken: !!tokens.refresh_token,
      tokenType: tokens.token_type,
    })

    console.log('[OAuth Callback] Verifying ID token...')
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const googleUser = ticket.getPayload()
    console.log('[OAuth Callback] Google user payload:', {
      hasEmail: !!googleUser?.email,
      hasSub: !!googleUser?.sub,
      hasName: !!googleUser?.name,
      email: googleUser?.email,
      sub: googleUser?.sub,
      name: googleUser?.name,
      picture: googleUser?.picture,
    })

    if (!googleUser || !googleUser.email || !googleUser.sub) {
      console.log('[OAuth Callback] Missing required Google user data')
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent('Failed to get user information')}`, request.url),
      )
    }

    const payload = await getPayload({ config })

    console.log('[OAuth Callback] Searching for existing user by Google ID...')
    let existingUsers = await payload.find({
      collection: 'app-users',
      where: {
        googleId: {
          equals: googleUser.sub,
        },
      },
      limit: 1,
    })

    console.log('[OAuth Callback] Search by Google ID result:', {
      found: existingUsers.docs.length > 0,
      userId: existingUsers.docs[0]?.id || null,
      email: existingUsers.docs[0]?.email || null,
    })

    if (existingUsers.docs.length === 0) {
      console.log('[OAuth Callback] User not found by Google ID, searching by email...')
      existingUsers = await payload.find({
        collection: 'app-users',
        where: {
          email: {
            equals: googleUser.email,
          },
        },
        limit: 1,
      })

      console.log('[OAuth Callback] Search by email result:', {
        found: existingUsers.docs.length > 0,
        userId: existingUsers.docs[0]?.id || null,
        email: existingUsers.docs[0]?.email || null,
        hasGoogleId: !!existingUsers.docs[0]?.googleId,
      })
    }

    let user
    if (existingUsers.docs.length > 0) {
      console.log('[OAuth Callback] Existing user found, updating...')
      user = existingUsers.docs[0]

      console.log('[OAuth Callback] Current user state:', {
        id: user.id,
        email: user.email,
        name: user.name,
        googleId: user.googleId,
        authProvider: user.authProvider,
        hasVerificationCode: !!user.verificationCode,
        hasVerificationHash: !!user.verificationHash,
      })

      const updateData: Record<string, string | null> = {}
      if (!user.googleId) {
        updateData.googleId = googleUser.sub
        console.log('[OAuth Callback] Will add Google ID')
      }
      if (!user.authProvider || user.authProvider === 'email') {
        updateData.authProvider = 'google'
        console.log('[OAuth Callback] Will update auth provider to google')
      }
      if (!user.name && googleUser.name) {
        updateData.name = googleUser.name
        console.log('[OAuth Callback] Will update name')
      }
      if (user.verificationCode || user.verificationHash) {
        updateData.verificationCode = null
        updateData.verificationHash = null
        updateData.verificationTokenExpire = null
        updateData.verificationKind = null
        console.log('[OAuth Callback] Will clear verification fields')
      }

      if (Object.keys(updateData).length > 0) {
        console.log('[OAuth Callback] Updating user with data:', updateData)
        user = await payload.update({
          collection: 'app-users',
          id: user.id,
          data: updateData,
        })
        console.log('[OAuth Callback] User updated:', {
          id: user.id,
          email: user.email,
          name: user.name,
          googleId: user.googleId,
          authProvider: user.authProvider,
        })
      } else {
        console.log('[OAuth Callback] No updates needed for existing user')
      }
    } else {
      console.log('[OAuth Callback] Creating new user...')
      const randomPassword = crypto.randomUUID() + crypto.randomUUID()

      user = await payload.create({
        collection: 'app-users',
        data: {
          email: googleUser.email,
          password: randomPassword,
          name: googleUser.name || googleUser.email.split('@')[0],
          googleId: googleUser.sub,
          authProvider: 'google',
        },
      })

      console.log('[OAuth Callback] New user created:', {
        id: user.id,
        email: user.email,
        name: user.name,
        googleId: user.googleId,
        authProvider: user.authProvider,
      })
    }

    console.log('[OAuth Callback] Verifying user exists in database...')
    console.log('[OAuth Callback] User object from create/update:', {
      id: user.id,
      idType: typeof user.id,
      idString: String(user.id),
      email: user.email,
    })

    const verifyUser = await payload.findByID({
      collection: 'app-users',
      id: String(user.id),
      depth: 0,
    })

    console.log('[OAuth Callback] User verification:', {
      found: !!verifyUser,
      id: verifyUser?.id,
      idType: typeof verifyUser?.id,
      email: verifyUser?.email,
      idsMatch: String(verifyUser?.id) === String(user.id),
    })

    if (!verifyUser) {
      throw new Error('User not found in database after creation')
    }

    const secret = process.env.PAYLOAD_SECRET
    if (!secret) {
      console.error('[OAuth Callback] PAYLOAD_SECRET is not configured')
      throw new Error('PAYLOAD_SECRET is not configured')
    }

    const expiresIn = 7200
    const userId = String(verifyUser.id)
    
    console.log('[OAuth Callback] Using user ID for token:', {
      userId,
      userIdType: typeof userId,
      originalUserId: user.id,
      verifiedUserId: verifyUser.id,
    })

    const tokenPayload = {
      id: userId,
      email: verifyUser.email,
      collection: 'app-users',
    }

    console.log('[OAuth Callback] Creating JWT token with payload:', tokenPayload)
    const token = jwt.sign(tokenPayload, secret, {
      expiresIn,
    })

    console.log('[OAuth Callback] JWT token created:', {
      userId: user.id,
      email: user.email,
      tokenLength: token.length,
      tokenPreview: token.substring(0, 20) + '...',
      expiresIn,
      isProduction: process.env.NODE_ENV === 'production',
    })

    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('oauth', 'success')
    
    console.log('[OAuth Callback] Creating redirect response to:', redirectUrl.toString())
    const response = NextResponse.redirect(redirectUrl)
    
    response.cookies.delete('app-users-token')
    response.cookies.delete('payload-token')
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: expiresIn,
      path: '/',
    }

    console.log('[OAuth Callback] Setting cookie with options:', cookieOptions)
    console.log('[OAuth Callback] Cookie name: payload-token-app-users')
    response.cookies.set('payload-token-app-users', token, cookieOptions)

    console.log('[OAuth Callback] Cookie set on response, redirecting to home')
    console.log('[OAuth Callback] Final user object:', {
      id: user.id,
      email: user.email,
      name: user.name,
      googleId: user.googleId,
      authProvider: user.authProvider,
    })
    
    return response
  } catch (error) {
    console.error('[OAuth Callback] Error occurred:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    })
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(errorMessage)}`, request.url),
    )
  }
}

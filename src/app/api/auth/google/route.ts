import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/api/auth/google/callback`,
)

export async function GET(request: NextRequest) {
  try {
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      prompt: 'select_account',
    })

    return NextResponse.redirect(authUrl)
  } catch (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent('Failed to initiate authentication')}`, request.url),
    )
  }
}

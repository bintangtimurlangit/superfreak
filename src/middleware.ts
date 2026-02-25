import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LOG_PREFIX = '[API]'

async function getRequestBody(request: NextRequest): Promise<unknown> {
  try {
    const clone = request.clone()
    const contentType = clone.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      return await clone.json()
    }
    const text = await clone.text()
    return text || undefined
  } catch {
    return '[unable to parse]'
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (!pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const url = request.nextUrl
  const method = request.method
  const path = url.pathname
  const query = url.search || undefined

  const body =
    method !== 'GET' && method !== 'HEAD' ? await getRequestBody(request) : undefined

  const timestamp = new Date().toISOString()
  console.log(
    `${LOG_PREFIX} ${timestamp} REQUEST ${method} ${path}`,
    JSON.stringify({ timestamp, type: 'request', method, path, query, body }, null, 2),
  )

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}

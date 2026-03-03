import { NextRequest, NextResponse } from 'next/server'
import { withApiLogger } from '@/lib/api-logger'

/**
 * Server-side proxy to SuperSlice. Called from frontend as POST /api/slice.
 * SuperSlice is only reachable from server (e.g. http://superslice:8000 in Docker).
 * Do NOT use NEXT_PUBLIC_ for Superslice URL — this route uses server-only env.
 */
const SUPERSLICE_API_URL =
  process.env.SUPERSLICE_API_URL || process.env.NEXT_PUBLIC_SUPERSLICE_API_URL || 'http://localhost:8000'

export const POST = withApiLogger(async function sliceProxy(req: NextRequest) {
  try {
    const formData = await req.formData()

    if (!formData.get('file')) {
      return NextResponse.json({ detail: 'No file provided' }, { status: 400 })
    }

    const response = await fetch(`${SUPERSLICE_API_URL}/slice`, {
      method: 'POST',
      body: formData,
    })

    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')

    if (isJson) {
      const data = await response.json().catch(() => ({}))
      return NextResponse.json(data, { status: response.status })
    }

    const text = await response.text()
    return new NextResponse(text, {
      status: response.status,
      headers: { 'Content-Type': contentType || 'text/plain' },
    })
  } catch (error) {
    console.error('[API /api/slice] Error proxying to SuperSlice:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { detail: `Slice service error: ${message}` },
      { status: 502 }
    )
  }
})

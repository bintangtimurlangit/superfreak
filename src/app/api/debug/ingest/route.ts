import { NextRequest, NextResponse } from 'next/server'

const INGEST_URL = 'http://127.0.0.1:7877/ingest/36ed12ab-b5c5-46e1-8c4f-f5fb8dd64ccd'

// Proxy debug logs from the browser to the local ingest endpoint.
// This avoids CORS issues when calling 127.0.0.1 directly from frontend code.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    await fetch(INGEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}


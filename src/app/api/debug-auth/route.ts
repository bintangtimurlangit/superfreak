import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  return NextResponse.json({
    cookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value, valueLength: c.value?.length })),
    headers: Object.fromEntries(request.headers.entries()),
  })
}

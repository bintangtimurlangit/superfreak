import { NextRequest, NextResponse } from 'next/server'

const LOG_PREFIX = '[API]'

type LogMeta = {
  method: string
  path: string
  query?: string
  body?: unknown
  status?: number
  responseBody?: unknown
  error?: string
  durationMs?: number
}

function log(meta: LogMeta, type: 'request' | 'response' | 'error') {
  const timestamp = new Date().toISOString()
  const payload = { timestamp, type, ...meta }
  const line = `${LOG_PREFIX} ${timestamp} ${type.toUpperCase()} ${meta.method} ${meta.path}`
  if (type === 'error') {
    console.error(line, JSON.stringify(payload, null, 2))
  } else {
    console.log(line, JSON.stringify(payload, null, 2))
  }
}

async function getResponseBody(response: Response): Promise<unknown> {
  const clone = response.clone()
  const contentType = clone.headers.get('content-type') ?? ''
  try {
    if (contentType.includes('application/json')) {
      return await clone.json()
    }
    return await clone.text()
  } catch {
    return '[unable to parse response]'
  }
}

/** Context for dynamic routes (e.g. { params: Promise<{ slug: string }> }) */
export type ApiRouteContext = { params: Promise<Record<string, string | string[] | undefined>> }

/** Request type for route handlers (NextRequest or Request) */
export type ApiRequest = NextRequest | Request

type RouteHandlerWithContext = (
  request: ApiRequest,
  context: ApiRouteContext,
) => Promise<Response | NextResponse>
type RouteHandlerNoContext = (request: ApiRequest) => Promise<Response | NextResponse>

export function withApiLogger<C extends ApiRouteContext>(
  handler: (request: ApiRequest, context: C) => Promise<Response | NextResponse>,
): (request: ApiRequest, context: C) => Promise<Response | NextResponse>
export function withApiLogger(
  handler: RouteHandlerNoContext,
): RouteHandlerNoContext
export function withApiLogger(
  handler:
    | RouteHandlerWithContext
    | RouteHandlerNoContext,
): RouteHandlerWithContext | RouteHandlerNoContext {
  return (async (request: ApiRequest, context?: ApiRouteContext) => {
    const start = Date.now()
    const url = 'url' in request ? request.url : (request as Request).url
    const urlObj = new URL(url)
    const path = urlObj.pathname
    const method = request.method

    try {
      const response = await handler(request, context as ApiRouteContext)
      const durationMs = Date.now() - start
      const status = response.status
      const responseBody = response.body ? await getResponseBody(response) : undefined

      log(
        {
          method,
          path,
          status,
          responseBody,
          durationMs,
        },
        'response',
      )

      return response
    } catch (error) {
      const durationMs = Date.now() - start
      const errorMessage = error instanceof Error ? error.message : String(error)

      log(
        {
          method,
          path,
          error: errorMessage,
          durationMs,
        },
        'error',
      )

      throw error
    }
  }) as RouteHandlerWithContext | RouteHandlerNoContext
}

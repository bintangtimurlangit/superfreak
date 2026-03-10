'use client'

import { useState, useCallback } from 'react'
import { api, isUsingNestApi, getApiBaseUrl } from '@/lib/api-client'
import { HEALTH, PRINTING, AUTH } from '@/lib/api/urls'

type EndpointId =
  | 'health'
  | 'filament-types'
  | 'printing-options'
  | 'printing-pricing'
  | 'auth-me'

interface EndpointSpec {
  id: EndpointId
  label: string
  path: string
  method: 'GET' | 'POST'
}

const ENDPOINTS: EndpointSpec[] = [
  { id: 'health', label: 'Health', path: HEALTH, method: 'GET' },
  { id: 'filament-types', label: 'Printing: Filament types', path: `${PRINTING.filamentTypes}?isActive=true`, method: 'GET' },
  { id: 'printing-options', label: 'Printing: Options', path: `${PRINTING.options}?isActive=true`, method: 'GET' },
  { id: 'printing-pricing', label: 'Printing: Pricing', path: `${PRINTING.pricing}?isActive=true`, method: 'GET' },
  { id: 'auth-me', label: 'Auth: Me (current user)', path: AUTH.me, method: 'GET' },
]

interface TestResult {
  id: EndpointId
  fullUrl: string
  status: number | null
  ok: boolean | null
  body: unknown
  error: string | null
  durationMs: number | null
}

function serializeBody(body: unknown): string {
  if (body === null || body === undefined) return '(empty)'
  try {
    const s = JSON.stringify(body, null, 2)
    return s.length > 800 ? s.slice(0, 800) + '\n… (truncated)' : s
  } catch {
    return String(body)
  }
}

export default function ApiTestPage() {
  const [results, setResults] = useState<Record<EndpointId, TestResult | null>>({
    health: null,
    'filament-types': null,
    'printing-options': null,
    'printing-pricing': null,
    'auth-me': null,
  })
  const [loading, setLoading] = useState<EndpointId | 'all' | null>(null)

  const baseUrl = getApiBaseUrl()
  const usingNest = isUsingNestApi()

  const runOne = useCallback(
    async (spec: EndpointSpec) => {
      const id = spec.id
      setLoading(id)
      const fullUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}${spec.path.startsWith('/') ? spec.path : `/${spec.path}`}` : `(relative) ${spec.path}`
      const start = performance.now()
      let result: TestResult = {
        id,
        fullUrl,
        status: null,
        ok: null,
        body: null,
        error: null,
        durationMs: null,
      }
      try {
        const res = spec.method === 'GET' ? await api.get(spec.path) : await api.post(spec.path, {})
        const body = await res.json().catch(() => ({}))
        result = {
          ...result,
          status: res.status,
          ok: res.ok,
          body,
          durationMs: Math.round(performance.now() - start),
        }
      } catch (err: unknown) {
        const ax = err as { response?: { status: number; data: unknown }; message?: string }
        result = {
          ...result,
          status: ax.response?.status ?? 0,
          ok: false,
          body: ax.response?.data ?? null,
          error: ax.response ? `HTTP ${ax.response.status}` : (ax.message ?? String(err)),
          durationMs: Math.round(performance.now() - start),
        }
      }
      setResults((prev) => ({ ...prev, [id]: result }))
      setLoading(null)
    },
    [baseUrl],
  )

  const runAll = useCallback(async () => {
    setLoading('all')
    setResults({
      health: null,
      'filament-types': null,
      'printing-options': null,
      'printing-pricing': null,
      'auth-me': null,
    })
    for (const spec of ENDPOINTS) {
      await runOne(spec)
    }
    setLoading(null)
  }, [runOne])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-[#292929]">Backend connectivity debug</h1>

      <section className="rounded-xl border border-[#EFEFEF] bg-[#F8F8F8] p-4">
        <h2 className="text-sm font-semibold text-[#292929] mb-2">Config</h2>
        <ul className="text-sm text-[#555] space-y-1 font-mono">
          <li><strong>NEXT_PUBLIC_API_URL:</strong> {baseUrl || '(not set – requests go to same origin)'}</li>
          <li><strong>Using Nest API:</strong> {usingNest ? 'Yes' : 'No'}</li>
        </ul>
      </section>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={runAll}
          disabled={!!loading || !usingNest}
          className="px-4 py-2 bg-[#1D0DF3] text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a0cd9]"
        >
          {loading === 'all' ? 'Running…' : 'Run all tests'}
        </button>
        {!usingNest && (
          <span className="text-sm text-[#989898] self-center">Set NEXT_PUBLIC_API_URL to test backend.</span>
        )}
      </div>

      <div className="space-y-4">
        {ENDPOINTS.map((spec) => {
          const result = results[spec.id]
          const isRunning = loading === spec.id || loading === 'all'
          return (
            <div
              key={spec.id}
              className="rounded-xl border border-[#EFEFEF] bg-white p-4 space-y-2"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="font-medium text-[#292929]">{spec.label}</h3>
                <button
                  type="button"
                  onClick={() => runOne(spec)}
                  disabled={!!loading || !usingNest}
                  className="text-sm px-3 py-1.5 border border-[#DCDCDC] rounded-lg hover:bg-[#F5F5F5] disabled:opacity-50"
                >
                  {isRunning ? '…' : 'Test'}
                </button>
              </div>
              {result && (
                <>
                  <p className="text-xs text-[#7C7C7C] font-mono break-all">{result.fullUrl}</p>
                  <div className="flex items-center gap-3 text-sm">
                    {result.status != null && (
                      <span
                        className={
                          result.ok
                            ? 'text-green-600 font-medium'
                            : result.status === 0
                              ? 'text-red-600 font-medium'
                              : 'text-amber-600 font-medium'
                        }
                      >
                        {result.status === 0 ? 'Failed (no response)' : `HTTP ${result.status}`}
                      </span>
                    )}
                    {result.durationMs != null && (
                      <span className="text-[#989898]">{result.durationMs} ms</span>
                    )}
                    {result.error && (
                      <span className="text-red-600">{result.error}</span>
                    )}
                  </div>
                  {(result.body !== null && result.body !== undefined) && (
                    <pre className="p-3 bg-[#F8F8F8] rounded-lg text-xs overflow-auto max-h-48 font-mono text-[#292929]">
                      {serializeBody(result.body)}
                    </pre>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

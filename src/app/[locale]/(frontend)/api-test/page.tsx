'use client'

import { useState } from 'react'
import { api, isUsingNestApi } from '@/lib/api-client'
import { HEALTH } from '@/lib/api/urls'

export default function ApiTestPage() {
  const [result, setResult] = useState<{ status: number; data: unknown; error?: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || '(not set – using Next.js routes)') : ''

  async function testHealth() {
    setLoading(true)
    setResult(null)
    try {
      const res = await api.get(HEALTH)
      const data = await res.json().catch(() => ({}))
      setResult({ status: res.status, data })
    } catch (err) {
      setResult({
        status: 0,
        data: null,
        error: err instanceof Error ? err.message : 'Request failed',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">API connection test</h1>
      <p className="text-sm text-gray-600">
        <strong>NEXT_PUBLIC_API_URL:</strong> {baseUrl}
        <br />
        <strong>Using NestJS API:</strong> {isUsingNestApi() ? 'Yes' : 'No'}
      </p>
      <button
        type="button"
        onClick={testHealth}
        disabled={loading}
        className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
      >
        {loading ? 'Calling…' : 'Call GET /health'}
      </button>
      {result && (
        <pre className="p-4 bg-gray-100 rounded text-sm overflow-auto">
          {result.error
            ? `Error: ${result.error}`
            : `Status: ${result.status}\n${JSON.stringify(result.data, null, 2)}`}
        </pre>
      )}
    </div>
  )
}

/**
 * API client for the NestJS backend.
 * Set NEXT_PUBLIC_API_URL (e.g. http://localhost:4000) to use NestJS; leave unset to keep using Next.js API routes.
 */

const BASE_URL = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL ?? '') : process.env.NEXT_PUBLIC_API_URL ?? ''

function url(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  if (BASE_URL) return `${BASE_URL.replace(/\/$/, '')}${p}`
  return p
}

const defaultOptions: RequestInit = {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
}

export async function get(path: string, options?: RequestInit): Promise<Response> {
  return fetch(url(path), { ...defaultOptions, ...options, method: 'GET' })
}

export async function post(path: string, body?: unknown, options?: RequestInit): Promise<Response> {
  return fetch(url(path), {
    ...defaultOptions,
    ...options,
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export async function patch(path: string, body?: unknown, options?: RequestInit): Promise<Response> {
  return fetch(url(path), {
    ...defaultOptions,
    ...options,
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export async function del(path: string, options?: RequestInit): Promise<Response> {
  return fetch(url(path), { ...defaultOptions, ...options, method: 'DELETE' })
}

/** POST with FormData (e.g. file upload). Omits Content-Type so browser sets multipart boundary. */
export async function postFormData(path: string, formData: FormData, options?: RequestInit): Promise<Response> {
  const headers = new Headers(defaultOptions.headers)
  headers.delete('Content-Type')
  return fetch(url(path), {
    ...defaultOptions,
    ...options,
    method: 'POST',
    headers,
    body: formData,
  })
}

/** Check if the app is configured to use the NestJS backend. */
export function isUsingNestApi(): boolean {
  return Boolean(BASE_URL)
}

export const api = { get, post, patch, delete: del, postFormData, isUsingNestApi }

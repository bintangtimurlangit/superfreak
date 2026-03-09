/**
 * API client for the NestJS backend (Axios-based).
 * Set NEXT_PUBLIC_API_URL to use NestJS; leave unset to use Next.js API routes.
 */

import { apiClient, isUsingNestApi as axiosIsUsingNestApi } from '@/lib/api/axios-client'

const BASE_URL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? '')
    : process.env.NEXT_PUBLIC_API_URL ?? ''

function pathOnly(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

/** Response-like object so existing res.ok / res.json() code keeps working. */
function toResponse<T>(data: T, status: number): ResponseLike<T> {
  const ok = status >= 200 && status < 300
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
  }
}

function toErrorResponse(status: number, data: unknown): ResponseLike<unknown> {
  return {
    ok: false,
    status,
    json: () => Promise.resolve(data ?? {}),
  }
}

interface ResponseLike<T> {
  ok: boolean
  status: number
  json: () => Promise<T>
}

export async function get(path: string): Promise<ResponseLike<unknown>> {
  try {
    const res = await apiClient.get(pathOnly(path))
    return toResponse(res.data, res.status)
  } catch (err: unknown) {
    const ax = err as { response?: { status: number; data: unknown } }
    if (ax.response) return toErrorResponse(ax.response.status, ax.response.data)
    throw err
  }
}

export async function post(path: string, body?: unknown): Promise<ResponseLike<unknown>> {
  try {
    const res = await apiClient.post(pathOnly(path), body)
    return toResponse(res.data, res.status)
  } catch (err: unknown) {
    const ax = err as { response?: { status: number; data: unknown } }
    if (ax.response) return toErrorResponse(ax.response.status, ax.response.data)
    throw err
  }
}

export async function patch(path: string, body?: unknown): Promise<ResponseLike<unknown>> {
  try {
    const res = await apiClient.patch(pathOnly(path), body)
    return toResponse(res.data, res.status)
  } catch (err: unknown) {
    const ax = err as { response?: { status: number; data: unknown } }
    if (ax.response) return toErrorResponse(ax.response.status, ax.response.data)
    throw err
  }
}

export async function del(path: string): Promise<ResponseLike<unknown>> {
  try {
    const res = await apiClient.delete(pathOnly(path))
    return toResponse(res.data, res.status)
  } catch (err: unknown) {
    const ax = err as { response?: { status: number; data: unknown } }
    if (ax.response) return toErrorResponse(ax.response.status, ax.response.data)
    throw err
  }
}

/** POST with FormData (e.g. file upload). */
export async function postFormData(
  path: string,
  formData: FormData
): Promise<ResponseLike<unknown>> {
  try {
    const res = await apiClient.post(pathOnly(path), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return toResponse(res.data, res.status)
  } catch (err: unknown) {
    const ax = err as { response?: { status: number; data: unknown } }
    if (ax.response) return toErrorResponse(ax.response.status, ax.response.data)
    throw err
  }
}

export function isUsingNestApi(): boolean {
  return axiosIsUsingNestApi()
}

/** Base URL for Nest API (e.g. for EventSource or download links). Empty when not using Nest. */
export function getApiBaseUrl(): string {
  return (BASE_URL || '').replace(/\/$/, '')
}

export const api = { get, post, patch, delete: del, postFormData, isUsingNestApi, getApiBaseUrl }

/** Direct axios client for use with useQuery/useMutation (returns .data). */
export { apiClient } from '@/lib/api/axios-client'

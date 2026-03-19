/**
 * Axios instance for the NestJS backend.
 * Base URL from NEXT_PUBLIC_API_URL; when unset, requests are relative (Next.js API routes).
 */

import axios from 'axios'

const BASE_URL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? '')
    : process.env.NEXT_PUBLIC_API_URL ?? ''

export const apiClient = axios.create({
  baseURL: BASE_URL.replace(/\/$/, '') || undefined,
  withCredentials: true,
})

/** Response type: axios returns data in .data */
export type ApiResponse<T = unknown> = { data: T; status: number }

export function isUsingNestApi(): boolean {
  return Boolean(BASE_URL)
}

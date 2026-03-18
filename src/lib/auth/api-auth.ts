'use client'

import { api } from '@/lib/api-client'
import { AUTH } from '@/lib/api/urls'

export interface ApiUser {
  id: string
  email: string
  name: string
  role: string
  image?: string
  phoneNumber?: string
}

export interface ApiSession {
  user: ApiUser
}

/**
 * NestJS auth API. Use when NEXT_PUBLIC_API_URL is set.
 */

export async function login(email: string, password: string): Promise<ApiSession> {
  const res = await api.post(AUTH.login, { email, password })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(err.message || 'Login failed')
  }
  const data = (await res.json()) as { user: ApiUser }
  return { user: data.user }
}

export async function register(name: string, email: string, password: string): Promise<ApiSession> {
  const res = await api.post(AUTH.register, { name, email, password })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(err.message || 'Registration failed')
  }
  const data = (await res.json()) as { user: ApiUser }
  return { user: data.user }
}

export async function logout(): Promise<void> {
  await api.post(AUTH.logout)
}

export async function getMe(): Promise<ApiUser | null> {
  const res = await api.get(AUTH.me)
  if (!res.ok) {
    // Clear invalid/expired session cookie so user is fully unauthenticated
    if (res.status === 401) {
      await logout().catch(() => {})
    }
    return null
  }
  const data = (await res.json()) as ApiUser
  return data
}

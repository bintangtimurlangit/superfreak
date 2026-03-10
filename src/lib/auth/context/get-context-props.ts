import type { ApiUser } from '@/lib/auth/api-auth'
import { headers as requestHeaders } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

async function fetchNestUser(): Promise<ApiUser | null> {
  if (!API_URL) return null
  try {
    const headers = await requestHeaders()
    const cookie = headers.get('cookie') ?? ''
    const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/auth/me`, {
      headers: { cookie },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return data as ApiUser
  } catch {
    return null
  }
}

export const getSession = async () => null
export const getUserAccounts = async () => []
export const getDeviceSessions = async () => []
export const currentUser = fetchNestUser

export const getContextProps = () => ({
  sessionPromise: Promise.resolve(null),
  userAccountsPromise: Promise.resolve([]),
  deviceSessionsPromise: Promise.resolve([]),
  currentUserPromise: fetchNestUser(),
})

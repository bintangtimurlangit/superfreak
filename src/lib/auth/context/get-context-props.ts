import type { Account, DeviceSession } from '@/lib/auth/types'
import { getPayload } from '@/lib/payload'
import { headers as requestHeaders } from 'next/headers'
import type { TypedUser } from 'payload'

export const getSession = async () => {
  const payload = await getPayload()
  if (!payload.betterAuth) {
    console.error('[getSession] betterAuth not available on payload instance')
    return null
  }
  const headers = await requestHeaders()
  type Session = (typeof payload.betterAuth.$Infer)['Session']
  const session = (await payload.betterAuth.api.getSession({ headers })) as Session
  return session
}

export const getUserAccounts = async (): Promise<Account[]> => {
  const payload = await getPayload()
  if (!payload.betterAuth) {
    console.error('[getUserAccounts] betterAuth not available on payload instance')
    return []
  }
  const headers = await requestHeaders()
  const accounts = await payload.betterAuth.api.listUserAccounts({ headers })
  return accounts
}

export const getDeviceSessions = async (): Promise<DeviceSession[]> => {
  const payload = await getPayload()
  if (!payload.betterAuth) {
    console.error('[getDeviceSessions] betterAuth not available on payload instance')
    return []
  }
  const headers = await requestHeaders()
  const sessions = await payload.betterAuth.api.listSessions({ headers })
  return sessions
}

export const currentUser = async () => {
  const payload = await getPayload()
  const headers = await requestHeaders()
  const { user } = await payload.auth({ headers })
  return user
}

export const getContextProps = () => {
  const sessionPromise = getSession()
  const userAccountsPromise = getUserAccounts()
  const deviceSessionsPromise = getDeviceSessions()
  const currentUserPromise = currentUser()
  return { sessionPromise, userAccountsPromise, deviceSessionsPromise, currentUserPromise }
}

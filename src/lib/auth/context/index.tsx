'use client'

import { createContext, useContext, ReactNode } from 'react'
import type { Session, Account, DeviceSession } from '@/lib/auth/types'
import type { ApiUser } from '@/lib/auth/api-auth'

type UserContextType = {
  sessionPromise: Promise<Session | null>
  userAccountsPromise: Promise<Account[] | null>
  deviceSessionsPromise: Promise<DeviceSession[] | null>
  currentUserPromise: Promise<ApiUser | null>
}

const BetterAuthContext = createContext<UserContextType | null>(null)

export function useBetterAuth(): UserContextType {
  const context = useContext(BetterAuthContext)
  if (context === null) {
    throw new Error('useBetterAuth must be used within a BetterAuthProvider')
  }
  return context
}

export function BetterAuthProvider({
  children,
  sessionPromise,
  userAccountsPromise,
  deviceSessionsPromise,
  currentUserPromise,
}: {
  children: ReactNode
  sessionPromise: Promise<Session | null>
  userAccountsPromise: Promise<Account[] | null>
  deviceSessionsPromise: Promise<DeviceSession[] | null>
  currentUserPromise: Promise<ApiUser | null>
}) {
  return (
    <BetterAuthContext.Provider
      value={{ sessionPromise, userAccountsPromise, deviceSessionsPromise, currentUserPromise }}
    >
      {children}
    </BetterAuthContext.Provider>
  )
}

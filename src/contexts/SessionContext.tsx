'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { appAuth } from '@/lib/auth'

interface SessionData {
  data: { user?: Record<string, unknown> }
  message: string
  isSuccess: boolean
}

interface SessionContextType extends SessionData {
  loading: boolean
  session: SessionData
  user: Record<string, unknown> | null
  displayName: string
  initials: string
  refreshSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

let ongoingRequest: Promise<void> | null = null

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState<boolean>(true)
  const [session, setSession] = useState<SessionData>({
    data: {},
    message: '',
    isSuccess: false,
  })
  const mountedRef = useRef(true)
  const initializedRef = useRef(false)

  const fetchSession = useCallback(async (force = false): Promise<void> => {
    if (!force && ongoingRequest) {
      await ongoingRequest
      return
    }

    ongoingRequest = (async () => {
      try {
        if (mountedRef.current) {
          setLoading(true)
        }

        const user = await appAuth.getMe()

        if (user && user.id) {
          try {
            const response = await fetch(`/api/app-users/${user.id}?depth=1`, {
              credentials: 'include',
            })
            if (response.ok) {
              const fullUser = await response.json()
              const newSession: SessionData = {
                data: { user: fullUser },
                message: 'Session retrieved successfully',
                isSuccess: true,
              }

              if (mountedRef.current) {
                setSession(newSession)
              }
            } else {
              const newSession: SessionData = {
                data: { user },
                message: 'Session retrieved successfully',
                isSuccess: true,
              }

              if (mountedRef.current) {
                setSession(newSession)
              }
            }
          } catch {
            const newSession: SessionData = {
              data: { user },
              message: 'Session retrieved successfully',
              isSuccess: true,
            }

            if (mountedRef.current) {
              setSession(newSession)
            }
          }
        } else {
          const newSession: SessionData = {
            data: {},
            message: 'No active session',
            isSuccess: false,
          }

          if (mountedRef.current) {
            setSession(newSession)
          }
        }
      } catch {
        const errorSession: SessionData = {
          data: {},
          message: 'Failed to fetch session',
          isSuccess: false,
        }

        if (mountedRef.current) {
          setSession(errorSession)
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
        ongoingRequest = null
      }
    })()

    await ongoingRequest
  }, [])

  useEffect(() => {
    mountedRef.current = true

    if (initializedRef.current) return
    initializedRef.current = true

    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    const isOAuthSuccess = urlParams?.has('oauth')
    
    if (isOAuthSuccess) {
      if (typeof window !== 'undefined') {
        const cleanUrl = window.location.pathname
        window.history.replaceState({}, '', cleanUrl)
      }
      fetchSession(true)
      return
    }

    fetchSession()

    return () => {
      mountedRef.current = false
    }
  }, [fetchSession])

  const refreshSession = useCallback(() => {
    return fetchSession(true)
  }, [fetchSession])

  const user = session.data?.user || null
  const displayName = session.data?.user?.name
    ? String(session.data.user.name)
    : session.data?.user?.email ? String(session.data.user.email).split('@')[0] : 'User'
  const initials =
    (session.data?.user?.name ? String(session.data.user.name)[0]?.toUpperCase() : '') ||
    (session.data?.user?.email ? String(session.data.user.email)[0]?.toUpperCase() : '') ||
    'U'

  return (
    <SessionContext.Provider
      value={{
        loading,
        session,
        ...session, // Spread session properties (isSuccess, message, data) for backward compatibility
        user,
        displayName,
        initials,
        refreshSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}

'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { appAuthClient } from '@/lib/auth'

interface SessionData {
  data: any
  message: string
  isSuccess: boolean
}

interface SessionContextType extends SessionData {
  loading: boolean
  session: SessionData
  user: any
  displayName: string
  initials: string
  refreshSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

// Request deduplication: track ongoing requests
let ongoingRequest: Promise<void> | null = null
let sessionCache: SessionData | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 30000 // 30 seconds cache

// localStorage keys
const STORAGE_KEY = 'superfreak_session'
const STORAGE_TIMESTAMP_KEY = 'superfreak_session_timestamp'
const STORAGE_DURATION = 5 * 60 * 1000 // 5 minutes for localStorage cache

// Helper functions for localStorage
const getStoredSession = (): SessionData | null => {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY)
    
    if (!stored || !timestamp) return null
    
    const age = Date.now() - parseInt(timestamp, 10)
    if (age > STORAGE_DURATION) {
      // Expired, remove it
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_TIMESTAMP_KEY)
      return null
    }
    
    return JSON.parse(stored) as SessionData
  } catch (error) {
    console.error('Failed to read session from localStorage:', error)
    return null
  }
}

const setStoredSession = (session: SessionData): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString())
  } catch (error) {
    console.error('Failed to save session to localStorage:', error)
  }
}

const clearStoredSession = (): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY)
  } catch (error) {
    console.error('Failed to clear session from localStorage:', error)
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Always start with loading=true to match server render (prevents hydration mismatch)
  const [loading, setLoading] = useState<boolean>(true)
  const [session, setSession] = useState<SessionData>({
    data: {},
    message: '',
    isSuccess: false,
  })
  const mountedRef = useRef(true)
  const initializedRef = useRef(false)

  const fetchSession = useCallback(async (force = false): Promise<void> => {
    // Check in-memory cache first (unless forced refresh)
    const now = Date.now()
    if (!force && sessionCache && (now - cacheTimestamp) < CACHE_DURATION) {
      if (mountedRef.current) {
        setSession(sessionCache)
        setLoading(false)
      }
      return
    }

    // Check localStorage cache (unless forced refresh)
    if (!force) {
      const stored = getStoredSession()
      if (stored) {
        // Use stored session immediately for instant UI
        if (mountedRef.current) {
          setSession(stored)
          sessionCache = stored
          cacheTimestamp = now
          setLoading(false)
        }
        // Don't fetch if we have valid cached data - return early
        return
      }
    }

    // Deduplicate: if a request is already in progress, wait for it
    if (ongoingRequest) {
      await ongoingRequest
      // After waiting, check cache again
      if (sessionCache && (now - cacheTimestamp) < CACHE_DURATION) {
        if (mountedRef.current) {
          setSession(sessionCache)
          setLoading(false)
        }
      }
      return
    }

    // Start new request
    ongoingRequest = (async () => {
      try {
        if (mountedRef.current) {
          setLoading(true)
        }

        const { data, isSuccess, message } = await appAuthClient.getClientSession()

        // If we have a user, fetch the full user data with populated relationships
        if (isSuccess && (data as any)?.user?.id) {
          try {
            const response = await fetch(`/api/app-users/${(data as any).user.id}?depth=1`)
            if (response.ok) {
              const fullUser = await response.json()
              const newSession: SessionData = {
                data: { ...(data as any), user: fullUser },
                message,
                isSuccess,
              }
              
              // Update caches
              sessionCache = newSession
              cacheTimestamp = Date.now()
              setStoredSession(newSession) // Persist to localStorage

              if (mountedRef.current) {
                setSession(newSession)
              }
            } else {
              // If fetch fails, use basic session data
              const newSession: SessionData = {
                data: data || {},
                message,
                isSuccess,
              }
              
              sessionCache = newSession
              cacheTimestamp = Date.now()
              setStoredSession(newSession)

              if (mountedRef.current) {
                setSession(newSession)
              }
            }
          } catch (fetchError) {
            console.error('Failed to fetch full user data:', fetchError)
            // Fall back to basic session data
            const newSession: SessionData = {
              data: data || {},
              message,
              isSuccess,
            }
            
            sessionCache = newSession
            cacheTimestamp = Date.now()
            setStoredSession(newSession)

            if (mountedRef.current) {
              setSession(newSession)
            }
          }
        } else {
          const newSession: SessionData = {
            data: data || {},
            message,
            isSuccess,
          }
          
          sessionCache = newSession
          cacheTimestamp = Date.now()
          setStoredSession(newSession)

          if (mountedRef.current) {
            setSession(newSession)
          }
        }
      } catch (error) {
        console.error('Session fetch error:', error)
        const errorSession: SessionData = {
          data: {},
          message: 'Failed to fetch session',
          isSuccess: false,
        }
        
        // Clear stored session on error (might be invalid)
        clearStoredSession()
        
        // Don't cache errors
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
    
    // Only initialize once (prevents double initialization)
    if (initializedRef.current) return
    initializedRef.current = true
    
    // Check if we're returning from OAuth callback
    // OAuth redirects often include query params or we can check URL
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    const isOAuthCallback = typeof window !== 'undefined' && (
      window.location.search.includes('code=') ||
      window.location.search.includes('oauth') ||
      urlParams?.has('code') ||
      urlParams?.has('state')
    )
    
    // If OAuth callback, clear cache and force refresh
    if (isOAuthCallback) {
      clearStoredSession()
      sessionCache = null
      cacheTimestamp = 0
      // Clean up URL params after detecting OAuth callback
      if (typeof window !== 'undefined') {
        const cleanUrl = window.location.pathname
        window.history.replaceState({}, '', cleanUrl)
      }
      fetchSession(true) // Force refresh
      return
    }
    
    // Check if we have valid cached data (in-memory or localStorage)
    const now = Date.now()
    const hasValidInMemoryCache = sessionCache && (now - cacheTimestamp) < CACHE_DURATION
    const stored = getStoredSession()
    
    // If we have cached data, use it immediately (after hydration)
    if (stored && !hasValidInMemoryCache) {
      // We have localStorage cache but not in-memory, sync it
      sessionCache = stored
      cacheTimestamp = now
      if (mountedRef.current && sessionCache) {
        setSession(sessionCache)
        setLoading(false)
      }
      // Still fetch in background to verify (but don't block UI)
      fetchSession()
      return
    } else if (hasValidInMemoryCache && sessionCache) {
      // Use in-memory cache
      if (mountedRef.current) {
        setSession(sessionCache)
        setLoading(false)
      }
      return
    }
    
    // Only fetch if we don't have valid cached data
    fetchSession()

    return () => {
      mountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount - fetchSession is stable

  const refreshSession = useCallback(() => {
    return fetchSession(true) // Force refresh
  }, [fetchSession])

  // Listen for window focus (e.g., after OAuth redirect)
  // This helps refresh session when user returns from OAuth popup/redirect
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleFocus = () => {
      // When window regains focus, check if we need to refresh session
      // This is especially useful after OAuth redirects
      const now = Date.now()
      const cacheAge = now - cacheTimestamp
      
      // If cache is older than 5 seconds, refresh (might be stale after OAuth)
      if (cacheAge > 5000) {
        fetchSession(true)
      }
    }

    // Also check on visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleFocus()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const user = session.data?.user || null
  const displayName = session.data?.user?.name
    ? session.data.user.name
    : session.data?.user?.email?.split('@')[0] || 'User'
  const initials = session.data?.user?.name?.[0]?.toUpperCase()
    || session.data?.user?.email?.[0]?.toUpperCase()
    || 'U'

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


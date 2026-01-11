'use client'

import { appAuthClient } from '@/lib/auth'
import { useEffect, useState, useCallback } from 'react'

export const useSession = () => {
  const [loading, setLoading] = useState<boolean>(true)
  const [session, setSession] = useState<{
    data: any
    message: string
    isSuccess: boolean
  }>({
    data: {},
    message: '',
    isSuccess: false,
  })

  const fetchSession = useCallback(async () => {
    setLoading(true)
    try {
      const { data, isSuccess, message } = await appAuthClient.getClientSession()
      
      // If we have a user, fetch the full user data with populated relationships
      if (isSuccess && (data as any)?.user?.id) {
        try {
          const response = await fetch(`/api/app-users/${(data as any).user.id}?depth=1`)
          if (response.ok) {
            const fullUser = await response.json()
            setSession({
              data: { ...(data as any), user: fullUser },
              message,
              isSuccess,
            })
          } else {
            // If fetch fails, use basic session data
            setSession({
              data: data || {},
              message,
              isSuccess,
            })
          }
        } catch (fetchError) {
          console.error('Failed to fetch full user data:', fetchError)
          // Fall back to basic session data
          setSession({
            data: data || {},
            message,
            isSuccess,
          })
        }
      } else {
        setSession({
          data: data || {},
          message,
          isSuccess,
        })
      }
    } catch (error) {
      console.error('Session fetch error:', error)
      setSession({
        data: {},
        message: 'Failed to fetch session',
        isSuccess: false,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSession()
    // Removed window focus listener to prevent excessive session requests
  }, [fetchSession])

  return {
    loading,
    ...session,
    user: session.data?.user || null,
    displayName: session.data?.user?.name 
      ? session.data.user.name
      : session.data?.user?.email?.split('@')[0] || 'User',
    initials: session.data?.user?.name?.[0]?.toUpperCase() 
      || session.data?.user?.email?.[0]?.toUpperCase() 
      || 'U',
    refreshSession: fetchSession,
  }
}

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
      
      let sessionData: any = data
      
      if (isSuccess && data && typeof data === 'object' && data !== null) {
        const dataWithUser = data as { user?: { id?: string } }
        if (dataWithUser.user && typeof dataWithUser.user === 'object' && dataWithUser.user.id) {
          try {
            // Fetch user with populated profile picture (depth=1 is enough for one level)
            const userResponse = await fetch(`/api/app-users/${dataWithUser.user.id}?depth=1`, {
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            })
            
            if (userResponse.ok) {
              const userData = await userResponse.json()
              if (userData) {
                sessionData = {
                  ...data,
                  user: userData,
                }
              }
            } else {
              console.error('Failed to fetch user data:', userResponse.status, userResponse.statusText)
            }
          } catch (error) {
            console.error('Failed to fetch user with profile picture:', error)
          }
        }
      }
      
      setSession({
        data: sessionData,
        message,
        isSuccess,
      })
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
    
    const handleFocus = () => {
      fetchSession()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
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

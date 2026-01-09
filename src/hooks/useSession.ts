'use client'

import { appAuthClient } from '@/lib/auth'
import { useEffect, useState } from 'react'

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

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true)
      try {
        const { data, isSuccess, message } = await appAuthClient.getClientSession()
        setSession({
          data,
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
    }
    fetchSession()
    
    // Refresh session when window regains focus (useful after OAuth redirect)
    const handleFocus = () => {
      fetchSession()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return {
    loading,
    ...session,
    user: session.data?.user || null,
    // Helper to get display name
    displayName: session.data?.user?.firstName 
      ? `${session.data.user.firstName}${session.data.user.lastName ? ' ' + session.data.user.lastName : ''}`
      : session.data?.user?.email?.split('@')[0] || 'User',
    // Helper to get initials
    initials: session.data?.user?.firstName?.[0]?.toUpperCase() 
      || session.data?.user?.email?.[0]?.toUpperCase() 
      || 'U',
  }
}

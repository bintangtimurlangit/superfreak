'use client'

import { useEffect } from 'react'
import { useAuthSession } from '@/lib/auth/use-auth-session'
import { usePathname } from 'next/navigation'

export default function OrderRedirectHandler() {
  const { data: sessionData, isPending: sessionLoading } = useAuthSession()
  const isAuthenticated = !!sessionData?.user
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined' || sessionLoading) return

    const pendingOrderState = sessionStorage.getItem('pendingOrderState')
    const pendingNextStep = sessionStorage.getItem('pendingOrderNextStep')

    if (
      (pendingOrderState || pendingNextStep === 'true') &&
      isAuthenticated &&
      pathname !== '/order'
    ) {
      window.location.href = '/order'
    }
  }, [isAuthenticated, sessionLoading, pathname])

  return null
}

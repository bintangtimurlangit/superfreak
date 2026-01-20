'use client'

import { useEffect } from 'react'
import { useSession } from '@/features/auth/hooks/useSession'
import { usePathname } from 'next/navigation'

/**
 * Handles redirect to /order page after OAuth login when there's pending order state
 */
export default function OrderRedirectHandler() {
  const { isSuccess: isAuthenticated, loading: sessionLoading } = useSession()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined' || sessionLoading) return

    // Check if we have pending order state and user is authenticated
    const pendingOrderState = sessionStorage.getItem('pendingOrderState')
    const pendingNextStep = sessionStorage.getItem('pendingOrderNextStep')

    if (
      (pendingOrderState || pendingNextStep === 'true') &&
      isAuthenticated &&
      pathname !== '/order'
    ) {
      // Redirect to order page to restore state
      window.location.href = '/order'
    }
  }, [isAuthenticated, sessionLoading, pathname])

  return null
}

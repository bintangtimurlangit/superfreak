'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isUsingNestApi } from '@/lib/api-client'
import { getMe, logout as apiLogout } from './api-auth'

/**
 * Session hook: uses NestJS GET /auth/me when NEXT_PUBLIC_API_URL is set.
 * Return shape: { data: { user } | null, isPending, refetch }.
 */
export function useAuthSession() {
  const useNest = isUsingNestApi()

  const apiQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    enabled: useNest,
    staleTime: 60 * 1000,
  })

  const user = apiQuery.data
  return {
    data: user ? { user } : null,
    isPending: apiQuery.isPending,
    refetch: apiQuery.refetch,
  }
}

/** Sign out: POST /auth/logout then clear cache and redirect. */
export function useSignOut(): (opts?: { callbackURL?: string }) => Promise<void> {
  const queryClient = useQueryClient()
  return async (opts?: { callbackURL?: string }) => {
    if (isUsingNestApi()) {
      try {
        await apiLogout()
      } catch (_err) {
        // Still clear local state and redirect so UI doesn't stay "logged in"
      } finally {
        queryClient.setQueryData(['auth', 'me'], null)
        queryClient.removeQueries({ queryKey: ['auth', 'me'] })
      }
      if (typeof window !== 'undefined') {
        window.location.href = opts?.callbackURL ?? '/'
      }
    } else {
      if (typeof window !== 'undefined') {
        window.location.href = opts?.callbackURL ?? '/'
      }
    }
  }
}

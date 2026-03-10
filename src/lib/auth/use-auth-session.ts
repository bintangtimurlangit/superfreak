'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession as useBetterAuthSession, signOut as betterAuthSignOut } from '@/lib/auth/client'
import { isUsingNestApi } from '@/lib/api-client'
import { getMe, logout as apiLogout } from './api-auth'

/**
 * Single session hook for the app.
 * When NEXT_PUBLIC_API_URL is set: uses NestJS GET /auth/me.
 * Otherwise: uses better-auth useSession.
 * Return shape is compatible: { data: { user }, isPending, refetch }.
 */
export function useAuthSession() {
  const useNest = isUsingNestApi()

  const apiQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    enabled: useNest,
    staleTime: 60 * 1000,
  })

  const betterAuth = useBetterAuthSession()

  if (useNest) {
    const user = apiQuery.data
    return {
      data: user ? { user } : null,
      isPending: apiQuery.isPending,
      refetch: apiQuery.refetch,
    }
  }

  return {
    data: betterAuth.data ?? null,
    isPending: betterAuth.isPending,
    refetch: betterAuth.refetch,
  }
}

/** Sign out: NestJS logout or better-auth signOut. Use in Navbar, ProfileSidebar, etc. */
export function useSignOut(): (opts?: { callbackURL?: string }) => Promise<void> {
  const queryClient = useQueryClient()
  return async (opts?: { callbackURL?: string }) => {
    if (isUsingNestApi()) {
      try {
        await apiLogout()
      } finally {
        // Clear auth state immediately so UI shows logged-out
        queryClient.setQueryData(['auth', 'me'], null)
        queryClient.removeQueries({ queryKey: ['auth', 'me'] })
      }
      // Full-page redirect so browser applies cleared cookie and next load has no session
      if (typeof window !== 'undefined') {
        window.location.href = opts?.callbackURL ?? '/'
      }
    } else {
      await betterAuthSignOut(opts as Parameters<typeof betterAuthSignOut>[0])
    }
  }
}

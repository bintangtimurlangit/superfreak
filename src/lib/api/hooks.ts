'use client'

/**
 * React Query + Axios helpers for NestJS API.
 * Use useApiQuery for GET, useApiMutation for POST/PATCH/DELETE.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { apiClient, isUsingNestApi } from './axios-client'

/** GET with useQuery; returns .data from axios. Only runs when isUsingNestApi(). */
export function useApiQuery<T>(
  queryKey: unknown[],
  path: string,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  const enabled = isUsingNestApi() && (options?.enabled !== false)
  return useQuery({
    ...options,
    queryKey,
    queryFn: async () => {
      const res = await apiClient.get<T>(path)
      return res.data
    },
    enabled,
  })
}

/** POST/PATCH/DELETE with useMutation; returns .data from axios. */
export function useApiMutation<TData = unknown, TVariables = unknown>(
  method: 'post' | 'patch' | 'delete',
  path: string,
  options?: UseMutationOptions<TData, Error, TVariables>
) {
  const queryClient = useQueryClient()
  return useMutation({
    ...options,
    mutationFn: async (body?: TVariables) => {
      const res =
        method === 'post'
          ? await apiClient.post<TData>(path, body)
          : method === 'patch'
            ? await apiClient.patch<TData>(path, body)
            : await apiClient.delete<TData>(path)
      return res.data
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      options?.onSuccess?.(...args)
    },
  })
}

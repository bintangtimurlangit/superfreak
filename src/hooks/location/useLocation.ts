import { useQuery } from '@tanstack/react-query'
import { Province, Regency, District, Village } from '@/lib/types'

// Fetch provinces
export function useProvinces(enabled: boolean = true) {
  return useQuery({
    queryKey: ['provinces'],
    queryFn: async () => {
      const response = await fetch('/api/wilayah/provinces')
      if (!response.ok) throw new Error('Failed to fetch provinces')
      const data: Province[] = await response.json()
      return data
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - React Query handles caching
    enabled: enabled,
  })
}

// Fetch regencies by province code
export function useRegencies(provinceCode: string | undefined) {
  return useQuery({
    queryKey: ['regencies', provinceCode],
    queryFn: async () => {
      if (!provinceCode) return []
      const response = await fetch(`/api/wilayah/regencies/${provinceCode}`)
      if (!response.ok) throw new Error('Failed to fetch regencies')
      const data: Regency[] = await response.json()
      return data
    },
    enabled: !!provinceCode,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - React Query handles caching
  })
}

// Fetch districts by regency code
export function useDistricts(regencyCode: string | undefined) {
  return useQuery({
    queryKey: ['districts', regencyCode],
    queryFn: async () => {
      if (!regencyCode) return []
      const response = await fetch(`/api/wilayah/districts/${regencyCode}`)
      if (!response.ok) throw new Error('Failed to fetch districts')
      const data: District[] = await response.json()
      return data
    },
    enabled: !!regencyCode,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - React Query handles caching
  })
}

// Fetch villages by district code
export function useVillages(districtCode: string | undefined) {
  return useQuery({
    queryKey: ['villages', districtCode],
    queryFn: async () => {
      if (!districtCode) return []
      const response = await fetch(`/api/wilayah/villages/${districtCode}`)
      if (!response.ok) throw new Error('Failed to fetch villages')
      const data: Village[] = await response.json()
      return data
    },
    enabled: !!districtCode,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - React Query handles caching
  })
}

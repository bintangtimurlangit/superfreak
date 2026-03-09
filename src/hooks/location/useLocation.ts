import { useQuery } from '@tanstack/react-query'
import { Province, Regency, District, Village } from '@/lib/types'
import { api, isUsingNestApi } from '@/lib/api-client'
import { WILAYAH } from '@/lib/api/urls'

export function useProvinces(enabled: boolean = true) {
  return useQuery({
    queryKey: ['provinces'],
    queryFn: async () => {
      const res = isUsingNestApi() ? await api.get(WILAYAH.provinces) : await fetch(WILAYAH.provinces)
      const response = typeof (res as { ok?: boolean }).ok === 'boolean' ? res as { ok: boolean; json: () => Promise<Province[]> } : res as Response
      if (!response.ok) throw new Error('Failed to fetch provinces')
      const data: Province[] = await response.json()
      return data
    },
    staleTime: 24 * 60 * 60 * 1000,
    enabled: enabled,
  })
}

export function useRegencies(provinceCode: string | undefined) {
  return useQuery({
    queryKey: ['regencies', provinceCode],
    queryFn: async () => {
      if (!provinceCode) return []
      const path = WILAYAH.regencies(provinceCode)
      const res = isUsingNestApi() ? await api.get(path) : await fetch(path)
      const response = typeof (res as { ok?: boolean }).ok === 'boolean' ? res as { ok: boolean; json: () => Promise<Regency[]> } : res as Response
      if (!response.ok) throw new Error('Failed to fetch regencies')
      const data: Regency[] = await response.json()
      return data
    },
    enabled: !!provinceCode,
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useDistricts(regencyCode: string | undefined) {
  return useQuery({
    queryKey: ['districts', regencyCode],
    queryFn: async () => {
      if (!regencyCode) return []
      const path = WILAYAH.districts(regencyCode)
      const res = isUsingNestApi() ? await api.get(path) : await fetch(path)
      const response = typeof (res as { ok?: boolean }).ok === 'boolean' ? res as { ok: boolean; json: () => Promise<District[]> } : res as Response
      if (!response.ok) throw new Error('Failed to fetch districts')
      const data: District[] = await response.json()
      return data
    },
    enabled: !!regencyCode,
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useVillages(districtCode: string | undefined) {
  return useQuery({
    queryKey: ['villages', districtCode],
    queryFn: async () => {
      if (!districtCode) return []
      const path = WILAYAH.villages(districtCode)
      const res = isUsingNestApi() ? await api.get(path) : await fetch(path)
      const response = typeof (res as { ok?: boolean }).ok === 'boolean' ? res as { ok: boolean; json: () => Promise<Village[]> } : res as Response
      if (!response.ok) throw new Error('Failed to fetch villages')
      const data: Village[] = await response.json()
      return data
    },
    enabled: !!districtCode,
    staleTime: 24 * 60 * 60 * 1000,
  })
}

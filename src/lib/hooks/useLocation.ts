import { useQuery } from '@tanstack/react-query'
import { useLocationStore } from '@/lib/stores/locationStore'
import { Province, Regency, District, Village } from '@/lib/types'

// Fetch provinces
export function useProvinces(enabled: boolean = true) {
  const { provinces, setProvinces } = useLocationStore()
  
  return useQuery({
    queryKey: ['provinces'],
    queryFn: async () => {
      const response = await fetch('/api/wilayah/provinces')
      if (!response.ok) throw new Error('Failed to fetch provinces')
      const data: Province[] = await response.json()
      setProvinces(data)
      return data
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: enabled, // Only fetch when enabled
    initialData: provinces.length > 0 ? provinces : undefined,
  })
}

// Fetch regencies by province code
export function useRegencies(provinceCode: string | undefined) {
  const { getRegencies, setRegencies } = useLocationStore()
  
  return useQuery({
    queryKey: ['regencies', provinceCode],
    queryFn: async () => {
      if (!provinceCode) return []
      const response = await fetch(`/api/wilayah/regencies/${provinceCode}`)
      if (!response.ok) throw new Error('Failed to fetch regencies')
      const data: Regency[] = await response.json()
      setRegencies(provinceCode, data)
      return data
    },
    enabled: !!provinceCode,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    initialData: provinceCode ? getRegencies(provinceCode) : undefined,
  })
}

// Fetch districts by regency code
export function useDistricts(regencyCode: string | undefined) {
  const { getDistricts, setDistricts } = useLocationStore()
  
  return useQuery({
    queryKey: ['districts', regencyCode],
    queryFn: async () => {
      if (!regencyCode) return []
      const response = await fetch(`/api/wilayah/districts/${regencyCode}`)
      if (!response.ok) throw new Error('Failed to fetch districts')
      const data: District[] = await response.json()
      setDistricts(regencyCode, data)
      return data
    },
    enabled: !!regencyCode,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    initialData: regencyCode ? getDistricts(regencyCode) : undefined,
  })
}

// Fetch villages by district code
export function useVillages(districtCode: string | undefined) {
  const { getVillages, setVillages } = useLocationStore()
  
  return useQuery({
    queryKey: ['villages', districtCode],
    queryFn: async () => {
      if (!districtCode) return []
      const response = await fetch(`/api/wilayah/villages/${districtCode}`)
      if (!response.ok) throw new Error('Failed to fetch villages')
      const data: Village[] = await response.json()
      setVillages(districtCode, data)
      return data
    },
    enabled: !!districtCode,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    initialData: districtCode ? getVillages(districtCode) : undefined,
  })
}

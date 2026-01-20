import { create } from 'zustand'
import { Province, Regency, District, Village } from '@/lib/types'

interface LocationState {
  provinces: Province[]
  regenciesCache: Record<string, Regency[]>
  districtsCache: Record<string, District[]>
  villagesCache: Record<string, Village[]>
  
  setProvinces: (provinces: Province[]) => void
  setRegencies: (provinceCode: string, regencies: Regency[]) => void
  setDistricts: (regencyCode: string, districts: District[]) => void
  setVillages: (districtCode: string, villages: Village[]) => void
  
  getRegencies: (provinceCode: string) => Regency[] | undefined
  getDistricts: (regencyCode: string) => District[] | undefined
  getVillages: (districtCode: string) => Village[] | undefined
}

export const useLocationStore = create<LocationState>((set, get) => ({
  provinces: [],
  regenciesCache: {},
  districtsCache: {},
  villagesCache: {},
  
  setProvinces: (provinces) => set({ provinces }),
  
  setRegencies: (provinceCode, regencies) =>
    set((state) => ({
      regenciesCache: { ...state.regenciesCache, [provinceCode]: regencies },
    })),
  
  setDistricts: (regencyCode, districts) =>
    set((state) => ({
      districtsCache: { ...state.districtsCache, [regencyCode]: districts },
    })),
  
  setVillages: (districtCode, villages) =>
    set((state) => ({
      villagesCache: { ...state.villagesCache, [districtCode]: villages },
    })),
  
  getRegencies: (provinceCode) => get().regenciesCache[provinceCode],
  getDistricts: (regencyCode) => get().districtsCache[regencyCode],
  getVillages: (districtCode) => get().villagesCache[districtCode],
}))

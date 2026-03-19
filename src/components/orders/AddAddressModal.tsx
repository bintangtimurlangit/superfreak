'use client'

import { useState, useEffect } from 'react'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, X } from 'lucide-react'
import { useAuthSession } from '@/lib/auth/use-auth-session'
import { addressSchema, type AddressFormData } from '@/lib/validations/address'
import { useProvinces, useRegencies, useDistricts, useVillages } from '@/hooks/location/useLocation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Button from '@/components/ui/Button'
import { api, isUsingNestApi } from '@/lib/api-client'
import { ADDRESSES, USER_ADDRESSES } from '@/lib/api/urls'

export interface AddressForOrder {
  id: string
  recipientName: string
  phoneNumber: string
  addressLine1: string
  addressLine2?: string
  provinceCode: string
  regencyCode: string
  districtCode: string
  villageCode: string
  postalCode: string
  isDefault: boolean
  provinceName?: string
  regencyName?: string
  districtName?: string
  villageName?: string
  rajaOngkirDestinationId?: number | null
  rajaOngkirProvinceName?: string | null
  rajaOngkirCityName?: string | null
  rajaOngkirDistrictName?: string | null
  rajaOngkirSubdistrictName?: string | null
}

interface AddAddressModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (address: AddressForOrder) => void
}

export default function AddAddressModal({
  isOpen,
  onClose,
  onSuccess,
}: AddAddressModalProps) {
  const { data: sessionData } = useAuthSession()
  const user = sessionData?.user || null
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [provinceDropdownOpened, setProvinceDropdownOpened] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      recipientName: '',
      phoneNumber: '',
      addressLine1: '',
      addressLine2: '',
      provinceCode: '',
      regencyCode: '',
      districtCode: '',
      villageCode: '',
      postalCode: '',
      isDefault: true,
    },
  })

  const provinceCode = watch('provinceCode')
  const regencyCode = watch('regencyCode')
  const districtCode = watch('districtCode')
  const { data: provinces = [] } = useProvinces(provinceDropdownOpened)
  const { data: regencies = [], isLoading: regenciesLoading } = useRegencies(provinceCode)
  const { data: districts = [], isLoading: districtsLoading } = useDistricts(regencyCode)
  const { data: villages = [], isLoading: villagesLoading } = useVillages(districtCode)

  useEffect(() => {
    setValue('regencyCode', '')
    setValue('districtCode', '')
    setValue('villageCode', '')
  }, [provinceCode, setValue])

  useEffect(() => {
    setValue('districtCode', '')
    setValue('villageCode', '')
  }, [regencyCode, setValue])

  useEffect(() => {
    setValue('villageCode', '')
  }, [districtCode, setValue])

  const useNest = isUsingNestApi()
  const createAddressMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      const body = useNest ? { ...data } : { ...data, user: user?.id }
      if (useNest) {
        const res = await api.post(ADDRESSES.base, body)
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { message?: string }
          throw new Error(err.message || 'Failed to save address')
        }
        return res.json()
      }
      const response = await fetch(USER_ADDRESSES.base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Failed to save address' }))
        throw new Error(err.message || 'Failed to save address')
      }
      return response.json()
    },
    onSuccess: async (created, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] })
      const province = provinces.find((p) => p.code === variables.provinceCode)
      const regency = regencies.find((r) => r.code === variables.regencyCode)
      const district = districts.find((d) => d.code === variables.districtCode)
      const village = villages.find((v) => v.code === variables.villageCode)
      const fullAddress: AddressForOrder = {
        ...created,
        provinceName: province?.name,
        regencyName: regency?.name,
        districtName: district?.name,
        villageName: village?.name,
      }
      onSuccess(fullAddress)
      reset()
      onClose()
    },
    onError: (err: Error) => {
      setError(err.message)
      setTimeout(() => setError(null), 5000)
    },
  })

  const onSubmit = async (data: AddressFormData) => {
    setError(null)
    const province = provinces.find((p) => p.code === data.provinceCode)
    const regency = regencies.find((r) => r.code === data.regencyCode)
    const district = districts.find((d) => d.code === data.districtCode)
    const village = villages.find((v) => v.code === data.villageCode)
    if (!province || !regency || !district || !village) {
      setError('Please select all location fields')
      return
    }
    try {
      const { matchRajaOngkirLocation } = await import('@/lib/rajaongkir')
      const rajaOngkirMatch = await matchRajaOngkirLocation({
        provinceName: province.name,
        regencyName: regency.name,
        districtName: district.name,
        villageName: village.name,
      })
      const addressData = {
        ...data,
        user: user?.id,
        rajaOngkirDestinationId: rajaOngkirMatch?.id ?? null,
        rajaOngkirLocationLabel: rajaOngkirMatch?.label ?? null,
        rajaOngkirZipCode: rajaOngkirMatch?.zip_code ?? null,
        rajaOngkirLastVerified: rajaOngkirMatch ? new Date().toISOString() : null,
        rajaOngkirProvinceName: rajaOngkirMatch?.province_name ?? null,
        rajaOngkirCityName: rajaOngkirMatch?.city_name ?? null,
        rajaOngkirDistrictName: rajaOngkirMatch?.district_name ?? null,
        rajaOngkirSubdistrictName: rajaOngkirMatch?.subdistrict_name ?? null,
      }
      createAddressMutation.mutate(addressData)
    } catch (err) {
      console.error('Error processing address:', err)
      setError('Failed to process address. Please try again.')
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setError(null)
      reset()
    }
  }, [isOpen, reset])

  useBodyScrollLock(isOpen)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#EFEFEF] flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1D0DF3] rounded-xl flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2
                className="text-[18px] md:text-[20px] font-bold text-[#292929]"
              >
                Add shipping address
              </h2>
              <p className="text-[12px] md:text-[14px] text-[#7C7C7C]">
                Stay on this page — your order won&apos;t be lost
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-[#292929]" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[14px]">
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="modal-recipientName"
                className="block text-[14px] font-medium text-[#292929] mb-2"
              >
                Recipient Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="modal-recipientName"
                {...register('recipientName')}
                className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                placeholder="Full name"
              />
              {errors.recipientName && (
                <p className="mt-1 text-[12px] md:text-[14px] text-red-600">{errors.recipientName.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="modal-phoneNumber"
                className="block text-[14px] font-medium text-[#292929] mb-2"
              >
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="modal-phoneNumber"
                {...register('phoneNumber')}
                className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                placeholder="08xx xxxx xxxx"
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-[12px] md:text-[14px] text-red-600">{errors.phoneNumber.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="modal-addressLine1"
                className="block text-[14px] font-medium text-[#292929] mb-2"
              >
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="modal-addressLine1"
                {...register('addressLine1')}
                className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                placeholder="Street name"
              />
              {errors.addressLine1 && (
                <p className="mt-1 text-[12px] md:text-[14px] text-red-600">{errors.addressLine1.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="modal-addressLine2"
                className="block text-[14px] font-medium text-[#292929] mb-2"
              >
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                id="modal-addressLine2"
                {...register('addressLine2')}
                className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                placeholder="House number, RT, RW"
              />
            </div>
            <div>
              <label
                htmlFor="modal-provinceCode"
                className="block text-[14px] font-medium text-[#292929] mb-2"
              >
                Province <span className="text-red-500">*</span>
              </label>
              <select
                id="modal-provinceCode"
                {...register('provinceCode')}
                onFocus={() => setProvinceDropdownOpened(true)}
                className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
              >
                <option value="">Select Province</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
              {errors.provinceCode && (
                <p className="mt-1 text-[12px] md:text-[14px] text-red-600">{errors.provinceCode.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="modal-regencyCode"
                className="block text-[14px] font-medium text-[#292929] mb-2"
              >
                City/Regency <span className="text-red-500">*</span>
              </label>
              <select
                id="modal-regencyCode"
                {...register('regencyCode')}
                disabled={!provinceCode || regenciesLoading}
                className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent disabled:bg-[#F8F8F8] disabled:text-[#989898]"
              >
                <option value="">
                  {regenciesLoading ? 'Loading...' : provinceCode ? 'Select City/Regency' : 'Select Province first'}
                </option>
                {regencies.map((r) => (
                  <option key={r.code} value={r.code}>{r.name}</option>
                ))}
              </select>
              {errors.regencyCode && (
                <p className="mt-1 text-[12px] md:text-[14px] text-red-600">{errors.regencyCode.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="modal-districtCode"
                className="block text-[14px] font-medium text-[#292929] mb-2"
              >
                District <span className="text-red-500">*</span>
              </label>
              <select
                id="modal-districtCode"
                {...register('districtCode')}
                disabled={!regencyCode || districtsLoading}
                className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent disabled:bg-[#F8F8F8] disabled:text-[#989898]"
              >
                <option value="">
                  {districtsLoading ? 'Loading...' : regencyCode ? 'Select District' : 'Select City/Regency first'}
                </option>
                {districts.map((d) => (
                  <option key={d.code} value={d.code}>{d.name}</option>
                ))}
              </select>
              {errors.districtCode && (
                <p className="mt-1 text-[12px] md:text-[14px] text-red-600">{errors.districtCode.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="modal-villageCode"
                className="block text-[14px] font-medium text-[#292929] mb-2"
              >
                Village/Sub-district <span className="text-red-500">*</span>
              </label>
              <select
                id="modal-villageCode"
                {...register('villageCode')}
                disabled={!districtCode || villagesLoading}
                className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent disabled:bg-[#F8F8F8] disabled:text-[#989898]"
              >
                <option value="">
                  {villagesLoading ? 'Loading...' : districtCode ? 'Select Village/Sub-district' : 'Select District first'}
                </option>
                {villages.map((v) => (
                  <option key={v.code} value={v.code}>{v.name}</option>
                ))}
              </select>
              {errors.villageCode && (
                <p className="mt-1 text-[12px] md:text-[14px] text-red-600">{errors.villageCode.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="modal-postalCode"
                className="block text-[14px] font-medium text-[#292929] mb-2"
              >
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="modal-postalCode"
                {...register('postalCode')}
                maxLength={5}
                className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                placeholder="12345"
              />
              {errors.postalCode && (
                <p className="mt-1 text-[12px] md:text-[14px] text-red-600">{errors.postalCode.message}</p>
              )}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="modal-isDefault"
                {...register('isDefault')}
                className="w-4 h-4 text-[#1D0DF3] border-[#DCDCDC] rounded focus:ring-2 focus:ring-[#1D0DF3]"
              />
              <label
                htmlFor="modal-isDefault"
                className="text-[14px] text-[#292929] cursor-pointer"
              >
                Set as default shipping address
              </label>
            </div>
          </div>

          <div className="p-4 border-t border-[#EFEFEF] flex justify-end gap-3 bg-gray-50/50">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="!bg-[#1D0DF3] hover:!bg-[#1a0bd9] text-white"
            >
              {isSubmitting ? 'Saving...' : 'Save & use this address'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

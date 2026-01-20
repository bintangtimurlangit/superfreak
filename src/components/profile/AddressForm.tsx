'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Home, Plus, Trash2, MapPin, Edit2, Check, X, AlertTriangle } from 'lucide-react'
import { useSession } from '@/features/auth/hooks/useSession'
import { SavedAddress } from '@/lib/types'
import { addressSchema, type AddressFormData } from '@/lib/validations/address'
import { useProvinces, useRegencies, useDistricts, useVillages } from '@/features/location/hooks/useLocation'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { payloadFetch } from '@/lib/payloadFetch'

export default function AddressForm() {
  const { user, loading: sessionLoading } = useSession()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [provinceDropdownOpened, setProvinceDropdownOpened] = useState(false)

  // Fetch saved addresses using React Query
  const { data: savedAddresses = [], isLoading: addressesLoading } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      
      const response = await payloadFetch(`/api/user-addresses`)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch addresses' }))
        throw new Error(error.message || 'Failed to fetch addresses')
      }
      
      const data = await response.json()
      return data.docs || []
    },
    enabled: !!user?.id,
  })

  // React Hook Form setup
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
      isDefault: false,
    },
  })

  // Watch form fields for dependent dropdowns
  const provinceCode = watch('provinceCode')
  const regencyCode = watch('regencyCode')
  const districtCode = watch('districtCode')

  // Fetch location data using custom hooks - provinces only load when dropdown is opened
  const { data: provinces = [] } = useProvinces(provinceDropdownOpened)
  const { data: regencies = [], isLoading: regenciesLoading } = useRegencies(provinceCode)
  const { data: districts = [], isLoading: districtsLoading } = useDistricts(regencyCode)
  const { data: villages = [], isLoading: villagesLoading } = useVillages(districtCode)

  // Reset dependent fields when parent changes
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

  // Create address mutation
  const createAddressMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      const response = await payloadFetch('/api/user-addresses', {
        method: 'POST',
        body: JSON.stringify({ ...data, user: user?.id }),
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to save address' }))
        throw new Error(error.message || 'Failed to save address')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] })
      setSuccess(true)
      setShowAddForm(false)
      reset()
      setTimeout(() => setSuccess(false), 3000)
    },
    onError: (err: Error) => {
      setError(err.message)
      setTimeout(() => setError(null), 5000)
    },
  })

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await payloadFetch(`/api/user-addresses/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to delete address' }))
        throw new Error(error.message || 'Failed to delete address')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] })
      setDeleteConfirmId(null)
    },
    onError: (err: Error) => {
      setError(err.message)
      setTimeout(() => setError(null), 5000)
      setDeleteConfirmId(null)
    },
  })

  // Form submit handler
  const onSubmit = (data: AddressFormData) => {
    if (savedAddresses.length >= 3) {
      setError('Maximum 3 addresses allowed')
      return
    }
    createAddressMutation.mutate(data)
  }

  // Format address for display
  const formatAddress = (address: SavedAddress) => {
    const province = provinces.find((p) => p.code === address.provinceCode)
    const regency = regencies.find((r) => r.code === address.regencyCode)
    const district = districts.find((d) => d.code === address.districtCode)
    const village = villages.find((v) => v.code === address.villageCode)

    const parts = [
      address.addressLine1,
      address.addressLine2,
      village?.name,
      district?.name,
      regency?.name,
      province?.name,
      address.postalCode,
    ].filter(Boolean)
    
    return parts.join(', ')
  }

  if (sessionLoading || addressesLoading) {
    return (
      <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 md:p-5">
        <div className="flex items-center justify-center py-12">
          <div className="text-[#989898]">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 md:p-5">
        <div className="flex items-center justify-center py-12">
          <div className="text-[#989898]">Please log in to manage your addresses</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 md:p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-[#1D0DF3] rounded-[12px] flex items-center justify-center flex-shrink-0">
          <Home className="h-6 w-6 text-white" />
        </div>
        <h2
          className="text-[24px] font-semibold text-[#292929]"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          Address Information
        </h2>
      </div>

      <div className="border-t border-[#EFEFEF] -mx-4 md:-mx-5 mb-6"></div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Address saved successfully!
        </div>
      )}

      <div className="space-y-6">
        {/* Saved Addresses */}
        {savedAddresses.length > 0 && (
          <div>
            <h3
              className="text-lg font-semibold text-[#292929] mb-4"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Saved Addresses
            </h3>
            <div className="space-y-3">
              {savedAddresses.map((address: SavedAddress) => (
                <div
                  key={address.id}
                  className={`border rounded-lg p-4 bg-white hover:bg-[#F8F8F8] transition-colors ${
                    address.isDefault ? 'border-[#1D0DF3] border-l-4' : 'border-[#EFEFEF]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <MapPin className="h-4 w-4 text-[#1D0DF3] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4
                            className="font-semibold text-[#292929] text-sm"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            {address.recipientName}
                          </h4>
                          {address.isDefault && (
                            <span
                              className="px-2 py-0.5 text-xs font-medium text-[#1D0DF3] bg-blue-50 rounded"
                              style={{ fontFamily: 'var(--font-geist-sans)' }}
                            >
                              Default
                            </span>
                          )}
                        </div>
                        <p
                          className="text-xs text-[#989898] mb-1"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          {address.phoneNumber}
                        </p>
                        <p
                          className="text-xs text-[#292929] leading-relaxed"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          {formatAddress(address)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(address.id)}
                        className="p-1.5 text-[#989898] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete address"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {savedAddresses.length === 0 && !showAddForm && (
          <div className="text-center py-12 border-2 border-dashed border-[#EFEFEF] rounded-[12px] bg-[#F8F8F8]">
            <MapPin className="h-12 w-12 text-[#989898] mx-auto mb-4" />
            <p className="text-[#989898] mb-4" style={{ fontFamily: 'var(--font-geist-sans)' }}>
              No addresses saved yet
            </p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#1D0DF3] rounded-lg hover:bg-[#1a0bd9] transition-colors"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              <Plus className="h-4 w-4" />
              Add Your First Address
            </button>
          </div>
        )}

        {/* Add New Address Section */}
        {savedAddresses.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-lg font-semibold text-[#292929]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Add New Address
            </h3>
            {!showAddForm && savedAddresses.length < 3 && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1D0DF3] hover:bg-blue-50 rounded-lg transition-colors"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                <Plus className="h-4 w-4" />
                Add Address
              </button>
            )}
          </div>
        )}

        {/* Add Address Form */}
        {showAddForm && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="border border-[#EFEFEF] rounded-[12px] p-5 bg-[#F8F8F8]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-[#1D0DF3]" />
                  <h3
                    className="text-lg font-semibold text-[#292929]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    New Address
                  </h3>
                </div>
              </div>

              <div className="space-y-4">
                {/* Recipient Name */}
                <div>
                  <label
                    htmlFor="recipientName"
                    className="block text-sm font-medium text-[#292929] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Recipient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="recipientName"
                    {...register('recipientName')}
                    className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                    placeholder="Full recipient name"
                  />
                  {errors.recipientName && (
                    <p className="mt-1 text-xs text-red-600">{errors.recipientName.message}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="block text-sm font-medium text-[#292929] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    {...register('phoneNumber')}
                    className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                    placeholder="08xx xxxx xxxx"
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-xs text-red-600">{errors.phoneNumber.message}</p>
                  )}
                </div>

                {/* Address Line 1 */}
                <div>
                  <label
                    htmlFor="addressLine1"
                    className="block text-sm font-medium text-[#292929] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="addressLine1"
                    {...register('addressLine1')}
                    className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                    placeholder="Street name"
                  />
                  {errors.addressLine1 && (
                    <p className="mt-1 text-xs text-red-600">{errors.addressLine1.message}</p>
                  )}
                </div>

                {/* Address Line 2 */}
                <div>
                  <label
                    htmlFor="addressLine2"
                    className="block text-sm font-medium text-[#292929] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    id="addressLine2"
                    {...register('addressLine2')}
                    className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                    placeholder="House number, RT, RW"
                  />
                </div>

                <div>
                  <label
                    htmlFor="provinceCode"
                    className="block text-sm font-medium text-[#292929] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="provinceCode"
                    {...register('provinceCode')}
                    onFocus={() => setProvinceDropdownOpened(true)}
                    className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <option value="">Select Province</option>
                    {provinces.map((province) => (
                      <option key={province.code} value={province.code}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                  {errors.provinceCode && (
                    <p className="mt-1 text-xs text-red-600">{errors.provinceCode.message}</p>
                  )}
                </div>

                {/* Regency */}
                <div>
                  <label
                    htmlFor="regencyCode"
                    className="block text-sm font-medium text-[#292929] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    City/Regency <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="regencyCode"
                    {...register('regencyCode')}
                    disabled={!provinceCode || regenciesLoading}
                    className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent disabled:bg-[#F8F8F8] disabled:text-[#989898]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <option value="">
                      {regenciesLoading
                        ? 'Loading...'
                        : provinceCode
                        ? 'Select City/Regency'
                        : 'Select Province first'}
                    </option>
                    {regencies.map((regency) => (
                      <option key={regency.code} value={regency.code}>
                        {regency.name}
                      </option>
                    ))}
                  </select>
                  {errors.regencyCode && (
                    <p className="mt-1 text-xs text-red-600">{errors.regencyCode.message}</p>
                  )}
                </div>

                {/* District */}
                <div>
                  <label
                    htmlFor="districtCode"
                    className="block text-sm font-medium text-[#292929] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="districtCode"
                    {...register('districtCode')}
                    disabled={!regencyCode || districtsLoading}
                    className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent disabled:bg-[#F8F8F8] disabled:text-[#989898]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <option value="">
                      {districtsLoading
                        ? 'Loading...'
                        : regencyCode
                        ? 'Select District'
                        : 'Select City/Regency first'}
                    </option>
                    {districts.map((district) => (
                      <option key={district.code} value={district.code}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  {errors.districtCode && (
                    <p className="mt-1 text-xs text-red-600">{errors.districtCode.message}</p>
                  )}
                </div>

                {/* Village */}
                <div>
                  <label
                    htmlFor="villageCode"
                    className="block text-sm font-medium text-[#292929] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Village/Sub-district <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="villageCode"
                    {...register('villageCode')}
                    disabled={!districtCode || villagesLoading}
                    className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent disabled:bg-[#F8F8F8] disabled:text-[#989898]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <option value="">
                      {villagesLoading
                        ? 'Loading...'
                        : districtCode
                        ? 'Select Village/Sub-district'
                        : 'Select District first'}
                    </option>
                    {villages.map((village) => (
                      <option key={village.code} value={village.code}>
                        {village.name}
                      </option>
                    ))}
                  </select>
                  {errors.villageCode && (
                    <p className="mt-1 text-xs text-red-600">{errors.villageCode.message}</p>
                  )}
                </div>

                {/* Postal Code */}
                <div>
                  <label
                    htmlFor="postalCode"
                    className="block text-sm font-medium text-[#292929] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    {...register('postalCode')}
                    className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                    placeholder="12345"
                    maxLength={5}
                  />
                  {errors.postalCode && (
                    <p className="mt-1 text-xs text-red-600">{errors.postalCode.message}</p>
                  )}
                </div>

                {/* Default Checkbox */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    {...register('isDefault')}
                    className="w-4 h-4 text-[#1D0DF3] border-[#DCDCDC] rounded focus:ring-2 focus:ring-[#1D0DF3]"
                  />
                  <label
                    htmlFor="isDefault"
                    className="text-sm text-[#292929] cursor-pointer"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Set as default shipping address
                  </label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[#EFEFEF]">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  reset()
                  setError(null)
                }}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-medium text-[#292929] border border-[#DCDCDC] rounded-lg hover:bg-[#F8F8F8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-medium text-white bg-[#1D0DF3] rounded-lg hover:bg-[#1a0bd9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                {isSubmitting ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </form>
        )}

        {savedAddresses.length >= 3 && !showAddForm && (
          <div className="text-sm text-[#989898] text-center py-2">
            Maximum 3 addresses reached
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeleteConfirmId(null)
            }
          }}
        >
          <div
            className="bg-white rounded-[20px] border border-[#EFEFEF] p-6 max-w-md w-full"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-[#292929]">Delete Address</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="p-1 text-[#989898] hover:text-[#292929] rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-[#292929] mb-6">
              Are you sure you want to delete this address? This action cannot be undone.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-[#292929] border border-[#DCDCDC] rounded-lg hover:bg-[#F8F8F8] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteAddressMutation.mutate(deleteConfirmId)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

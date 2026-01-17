'use client'

import { useState, useEffect, useCallback } from 'react'
import { Home, Plus, Trash2, MapPin, Edit2, Check, X, AlertTriangle } from 'lucide-react'
import { useSession } from '@/hooks/useSession'
import { Address, SavedAddress, Province, Regency, District, Village } from '@/lib/types'

export default function AddressForm() {
  const { user, loading: sessionLoading } = useSession()
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [newAddresses, setNewAddresses] = useState<Address[]>([
    {
      id: 'new-1',
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
  ])
  const [showAddForm, setShowAddForm] = useState(false)

  const [provinces, setProvinces] = useState<Province[]>([])
  const [regencies, setRegencies] = useState<Record<string, Regency[]>>({})
  const [districts, setDistricts] = useState<Record<string, District[]>>({})
  const [villages, setVillages] = useState<Record<string, Village[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await fetch('/api/wilayah/provinces')
        if (!response.ok) throw new Error('Failed to fetch provinces')
        const data = await response.json()
        setProvinces(data)
      } catch (error) {
        console.error('Error fetching provinces:', error)
      }
    }
    fetchProvinces()
  }, [])

  const fetchSavedAddresses = useCallback(async () => {
    if (!user?.id) return

    try {
      const queryParams = new URLSearchParams({
        'where[user][equals]': user.id,
      })
      const response = await fetch(`/api/addresses?${queryParams.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to fetch addresses:', response.status, errorText)
        throw new Error('Failed to fetch addresses')
      }
      const data = await response.json()
      console.log('Fetched addresses response:', data)
      
      if (!data.docs || data.docs.length === 0) {
        console.log('No addresses found for user:', user.id)
        setSavedAddresses([])
        return
      }
      
      const addressesWithNames = await Promise.all(
        data.docs.map(async (addr: SavedAddress) => {
          const province = provinces.find((p) => p.code === addr.provinceCode)
          let regencyName = ''
          let districtName = ''
          let villageName = ''

          if (addr.provinceCode && addr.regencyCode) {
            try {
              const regencyResponse = await fetch(`/api/wilayah/regencies/${addr.provinceCode}`)
              if (regencyResponse.ok) {
                const regencies = await regencyResponse.json()
                const regency = regencies.find((r: Regency) => r.code === addr.regencyCode)
                regencyName = regency?.name || ''

                if (addr.districtCode) {
                  const districtResponse = await fetch(`/api/wilayah/districts/${addr.regencyCode}`)
                  if (districtResponse.ok) {
                    const districts = await districtResponse.json()
                    const district = districts.find((d: District) => d.code === addr.districtCode)
                    districtName = district?.name || ''

                    if (addr.villageCode) {
                      const villageResponse = await fetch(`/api/wilayah/villages/${addr.districtCode}`)
                      if (villageResponse.ok) {
                        const villages = await villageResponse.json()
                        const village = villages.find((v: Village) => v.code === addr.villageCode)
                        villageName = village?.name || ''
                      }
                    }
                  }
                }
              }
            } catch (err) {
              console.error('Error fetching location names:', err)
            }
          }

          return {
            ...addr,
            provinceName: province?.name || '',
            regencyName,
            districtName,
            villageName,
          }
        })
      )

      setSavedAddresses(addressesWithNames)
    } catch (error) {
      console.error('Error fetching addresses:', error)
    }
  }, [user?.id, provinces])

  useEffect(() => {
    if (user?.id && provinces.length > 0) {
      fetchSavedAddresses()
    }
  }, [user?.id, provinces.length, fetchSavedAddresses])

  const fetchRegencies = async (provinceCode: string, addressId: string) => {
    if (!provinceCode || regencies[provinceCode]) return

    setLoading((prev) => ({ ...prev, [`regencies-${addressId}`]: true }))
    try {
      const response = await fetch(`/api/wilayah/regencies/${provinceCode}`)
      if (!response.ok) throw new Error('Failed to fetch regencies')
      const data = await response.json()
      setRegencies((prev) => ({ ...prev, [provinceCode]: data }))
    } catch (error) {
      console.error('Error fetching regencies:', error)
    } finally {
      setLoading((prev) => ({ ...prev, [`regencies-${addressId}`]: false }))
    }
  }

  const fetchDistricts = async (regencyCode: string, addressId: string) => {
    if (!regencyCode || districts[regencyCode]) return

    setLoading((prev) => ({ ...prev, [`districts-${addressId}`]: true }))
    try {
      const response = await fetch(`/api/wilayah/districts/${regencyCode}`)
      if (!response.ok) throw new Error('Failed to fetch districts')
      const data = await response.json()
      setDistricts((prev) => ({ ...prev, [regencyCode]: data }))
    } catch (error) {
      console.error('Error fetching districts:', error)
    } finally {
      setLoading((prev) => ({ ...prev, [`districts-${addressId}`]: false }))
    }
  }

  const fetchVillages = async (districtCode: string, addressId: string) => {
    if (!districtCode || villages[districtCode]) return

    setLoading((prev) => ({ ...prev, [`villages-${addressId}`]: true }))
    try {
      const response = await fetch(`/api/wilayah/villages/${districtCode}`)
      if (!response.ok) throw new Error('Failed to fetch villages')
      const data = await response.json()
      setVillages((prev) => ({ ...prev, [districtCode]: data }))
    } catch (error) {
      console.error('Error fetching villages:', error)
    } finally {
      setLoading((prev) => ({ ...prev, [`villages-${addressId}`]: false }))
    }
  }

  const handleAddNewAddress = () => {
    if (savedAddresses.length + newAddresses.length >= 3) {
      setError('Maximum 3 addresses allowed')
      return
    }
    setNewAddresses([
      ...newAddresses,
      {
        id: `new-${Date.now()}`,
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
    ])
    setError(null)
  }

  const handleRemoveNewAddress = (id: string) => {
    if (newAddresses.length > 1) {
      setNewAddresses(newAddresses.filter((addr) => addr.id !== id))
    } else {
      setShowAddForm(false)
      setNewAddresses([
        {
          id: 'new-1',
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
      ])
    }
  }

  const handleInputChange = (id: string, field: string, value: string) => {
    setNewAddresses(
      newAddresses.map((addr) => {
        const updated = { ...addr, [field]: value }

        if (field === 'provinceCode') {
          updated.regencyCode = ''
          updated.districtCode = ''
          updated.villageCode = ''
          if (value) {
            fetchRegencies(value, id)
          }
        } else if (field === 'regencyCode') {
          updated.districtCode = ''
          updated.villageCode = ''
          if (value) {
            fetchDistricts(value, id)
          }
        } else if (field === 'districtCode') {
          updated.villageCode = ''
          if (value) {
            fetchVillages(value, id)
          }
        }

        return addr.id === id ? updated : addr
      }),
    )
  }

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setNewAddresses(
      newAddresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === id ? checked : false,
      })),
    )
  }

  const handleEditAddress = (_id: string) => {
  }

  const handleDeleteAddress = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmId) return

    try {
      const response = await fetch(`/api/addresses/${deleteConfirmId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete address' }))
        throw new Error(errorData.message || 'Failed to delete address')
      }

      setSavedAddresses(savedAddresses.filter((addr) => addr.id !== deleteConfirmId))
      setDeleteConfirmId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete address')
      setTimeout(() => setError(null), 5000)
      setDeleteConfirmId(null)
    }
  }

  const handleSetDefault = (id: string) => {
    setSavedAddresses(
      savedAddresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      })),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id) {
      setError('You must be logged in to save addresses')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const validAddresses = newAddresses.filter(
        (addr) =>
          addr.recipientName &&
          addr.phoneNumber &&
          addr.addressLine1 &&
          addr.provinceCode &&
          addr.regencyCode &&
          addr.districtCode &&
          addr.villageCode &&
          addr.postalCode,
      )

      if (validAddresses.length === 0) {
        setError('Please fill in at least one complete address')
        setSubmitting(false)
        return
      }

      for (const address of validAddresses) {
        const addressData = {
          recipientName: address.recipientName,
          phoneNumber: address.phoneNumber,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 || '',
          provinceCode: address.provinceCode,
          regencyCode: address.regencyCode,
          districtCode: address.districtCode,
          villageCode: address.villageCode,
          postalCode: address.postalCode,
          isDefault: address.isDefault,
          user: user.id,
        }

        const response = await fetch('/api/addresses', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(addressData),
        })

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: 'Failed to save address' }))
          console.error('Failed to save address:', response.status, errorData)
          throw new Error(errorData.message || 'Failed to save address')
        }
        const savedAddress = await response.json()
        console.log('Address saved successfully:', savedAddress)
      }

      setSuccess(true)
      setNewAddresses([
        {
          id: 'new-1',
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
      ])
      setShowAddForm(false)

      await fetchSavedAddresses()

      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save addresses')
    } finally {
      setSubmitting(false)
    }
  }

  const formatAddress = (address: SavedAddress) => {
    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.villageName,
      address.districtName,
      address.regencyName,
      address.provinceName,
      address.postalCode,
    ].filter(Boolean)
    return parts.join(', ')
  }

  if (sessionLoading) {
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

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Addresses saved successfully!
        </div>
      )}

      <div className="space-y-6">
        {savedAddresses.length > 0 && (
          <div>
            <h3
              className="text-lg font-semibold text-[#292929] mb-4"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Saved Addresses
            </h3>
            <div className="space-y-3">
              {savedAddresses.map((address) => (
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
                      {!address.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(address.id)}
                          className="p-1.5 text-[#989898] hover:text-[#1D0DF3] hover:bg-blue-50 rounded transition-colors"
                          title="Set as default"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEditAddress(address.id)}
                        className="p-1.5 text-[#989898] hover:text-[#1D0DF3] hover:bg-blue-50 rounded transition-colors"
                        title="Edit address"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(address.id)}
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

        {(showAddForm || savedAddresses.length > 0) && (
          <div>
            {savedAddresses.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-lg font-semibold text-[#292929]"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Add New Address
                </h3>
                {!showAddForm && (
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

            {showAddForm && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {newAddresses.map((address, index) => (
                  <div
                    key={address.id}
                    className="border border-[#EFEFEF] rounded-[12px] p-5 bg-[#F8F8F8]"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-[#1D0DF3]" />
                        <h3
                          className="text-lg font-semibold text-[#292929]"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          New Address {index + 1}
                        </h3>
                      </div>
                      {newAddresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveNewAddress(address.id)}
                          className="p-2 text-[#989898] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor={`recipientName-${address.id}`}
                          className="block text-sm font-medium text-[#292929] mb-2"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          Recipient Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id={`recipientName-${address.id}`}
                          value={address.recipientName}
                          onChange={(e) =>
                            handleInputChange(address.id, 'recipientName', e.target.value)
                          }
                          className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                          placeholder="Full recipient name"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`phoneNumber-${address.id}`}
                          className="block text-sm font-medium text-[#292929] mb-2"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          id={`phoneNumber-${address.id}`}
                          value={address.phoneNumber}
                          onChange={(e) =>
                            handleInputChange(address.id, 'phoneNumber', e.target.value)
                          }
                          className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                          placeholder="08xx xxxx xxxx"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`addressLine1-${address.id}`}
                          className="block text-sm font-medium text-[#292929] mb-2"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          Address Line 1 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id={`addressLine1-${address.id}`}
                          value={address.addressLine1}
                          onChange={(e) =>
                            handleInputChange(address.id, 'addressLine1', e.target.value)
                          }
                          className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                          placeholder="Street name"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`addressLine2-${address.id}`}
                          className="block text-sm font-medium text-[#292929] mb-2"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          Address Line 2 (Optional)
                        </label>
                        <input
                          type="text"
                          id={`addressLine2-${address.id}`}
                          value={address.addressLine2}
                          onChange={(e) =>
                            handleInputChange(address.id, 'addressLine2', e.target.value)
                          }
                          className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                          placeholder="House number, RT, RW"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`provinceCode-${address.id}`}
                          className="block text-sm font-medium text-[#292929] mb-2"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          Province <span className="text-red-500">*</span>
                        </label>
                        <select
                          id={`provinceCode-${address.id}`}
                          value={address.provinceCode}
                          onChange={(e) =>
                            handleInputChange(address.id, 'provinceCode', e.target.value)
                          }
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
                      </div>

                      <div>
                        <label
                          htmlFor={`regencyCode-${address.id}`}
                          className="block text-sm font-medium text-[#292929] mb-2"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          City/Regency <span className="text-red-500">*</span>
                        </label>
                        <select
                          id={`regencyCode-${address.id}`}
                          value={address.regencyCode}
                          onChange={(e) =>
                            handleInputChange(address.id, 'regencyCode', e.target.value)
                          }
                          disabled={!address.provinceCode || loading[`regencies-${address.id}`]}
                          className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent disabled:bg-[#F8F8F8] disabled:text-[#989898]"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          <option value="">
                            {loading[`regencies-${address.id}`]
                              ? 'Loading...'
                              : address.provinceCode
                                ? 'Select City/Regency'
                                : 'Select Province first'}
                          </option>
                          {regencies[address.provinceCode]?.map((regency) => (
                            <option key={regency.code} value={regency.code}>
                              {regency.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor={`districtCode-${address.id}`}
                          className="block text-sm font-medium text-[#292929] mb-2"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          District <span className="text-red-500">*</span>
                        </label>
                        <select
                          id={`districtCode-${address.id}`}
                          value={address.districtCode}
                          onChange={(e) =>
                            handleInputChange(address.id, 'districtCode', e.target.value)
                          }
                          disabled={!address.regencyCode || loading[`districts-${address.id}`]}
                          className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent disabled:bg-[#F8F8F8] disabled:text-[#989898]"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          <option value="">
                            {loading[`districts-${address.id}`]
                              ? 'Loading...'
                              : address.regencyCode
                                ? 'Select District'
                                : 'Select City/Regency first'}
                          </option>
                          {districts[address.regencyCode]?.map((district) => (
                            <option key={district.code} value={district.code}>
                              {district.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor={`villageCode-${address.id}`}
                          className="block text-sm font-medium text-[#292929] mb-2"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          Village/Sub-district <span className="text-red-500">*</span>
                        </label>
                        <select
                          id={`villageCode-${address.id}`}
                          value={address.villageCode}
                          onChange={(e) =>
                            handleInputChange(address.id, 'villageCode', e.target.value)
                          }
                          disabled={!address.districtCode || loading[`villages-${address.id}`]}
                          className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent disabled:bg-[#F8F8F8] disabled:text-[#989898]"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          <option value="">
                            {loading[`villages-${address.id}`]
                              ? 'Loading...'
                              : address.districtCode
                                ? 'Select Village/Sub-district'
                                : 'Select District first'}
                          </option>
                          {villages[address.districtCode]?.map((village) => (
                            <option key={village.code} value={village.code}>
                              {village.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor={`postalCode-${address.id}`}
                          className="block text-sm font-medium text-[#292929] mb-2"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          Postal Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id={`postalCode-${address.id}`}
                          value={address.postalCode}
                          onChange={(e) =>
                            handleInputChange(address.id, 'postalCode', e.target.value)
                          }
                          className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-white text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                          placeholder="12345"
                          maxLength={5}
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <input
                          type="checkbox"
                          id={`isDefault-${address.id}`}
                          checked={address.isDefault}
                          onChange={(e) => handleCheckboxChange(address.id, e.target.checked)}
                          className="w-4 h-4 text-[#1D0DF3] border-[#DCDCDC] rounded focus:ring-2 focus:ring-[#1D0DF3]"
                        />
                        <label
                          htmlFor={`isDefault-${address.id}`}
                          className="text-sm text-[#292929] cursor-pointer"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          Set as default shipping address
                        </label>
                      </div>
                    </div>
                  </div>
                ))}

                {savedAddresses.length + newAddresses.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddNewAddress}
                    className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-[#DCDCDC] rounded-lg text-[#292929] hover:border-[#1D0DF3] hover:text-[#1D0DF3] transition-colors"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">Add Another Address</span>
                  </button>
                )}

                {savedAddresses.length + newAddresses.length >= 3 && (
                  <div className="text-sm text-[#989898] text-center py-2">
                    Maximum 3 addresses reached
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-[#EFEFEF]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setNewAddresses([
                        {
                          id: 'new-1',
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
                      ])
                      setError(null)
                      setSuccess(false)
                    }}
                    disabled={submitting}
                    className="px-6 py-2.5 text-sm font-medium text-[#292929] border border-[#DCDCDC] rounded-lg hover:bg-[#F8F8F8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-[#1D0DF3] rounded-lg hover:bg-[#1a0bd9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    {submitting ? 'Saving...' : 'Save Addresses'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

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
                onClick={confirmDelete}
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

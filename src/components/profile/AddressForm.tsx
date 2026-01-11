'use client'

import { useState, useEffect } from 'react'
import { Home, Plus, Trash2, MapPin } from 'lucide-react'

interface Province {
  code: string
  name: string
}

interface Regency {
  code: string
  name: string
  province_code: string
}

interface District {
  code: string
  name: string
  regency_code: string
}

interface Village {
  code: string
  name: string
  district_code: string
}

interface Address {
  id: string
  recipientName: string
  phoneNumber: string
  addressLine1: string
  addressLine2: string
  provinceCode: string
  regencyCode: string
  districtCode: string
  villageCode: string
  postalCode: string
  isDefault: boolean
}

export default function AddressForm() {
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
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
  ])

  const [provinces, setProvinces] = useState<Province[]>([])
  const [regencies, setRegencies] = useState<Record<string, Regency[]>>({})
  const [districts, setDistricts] = useState<Record<string, District[]>>({})
  const [villages, setVillages] = useState<Record<string, Village[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

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

  const fetchDistricts = async (
    regencyCode: string,
    addressId: string
  ) => {
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

  const handleAddAddress = () => {
    setAddresses([
      ...addresses,
      {
        id: Date.now().toString(),
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

  const handleRemoveAddress = (id: string) => {
    if (addresses.length > 1) {
      setAddresses(addresses.filter((addr) => addr.id !== id))
    }
  }

  const handleInputChange = (id: string, field: string, value: string) => {
    setAddresses(
      addresses.map((addr) => {
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
      })
    )
  }

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setAddresses(
      addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === id ? checked : false,
      }))
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

      <div className="space-y-8">
        {addresses.map((address, index) => (
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
                  Address {index + 1}
                </h3>
                {address.isDefault && (
                  <span
                    className="px-2.5 py-1 text-xs font-medium text-[#1D0DF3] bg-blue-50 rounded"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Default
                  </span>
                )}
              </div>
              {addresses.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveAddress(address.id)}
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
                  onChange={(e) =>
                    handleCheckboxChange(address.id, e.target.checked)
                  }
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

        <button
          type="button"
          onClick={handleAddAddress}
          className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-[#DCDCDC] rounded-lg text-[#292929] hover:border-[#1D0DF3] hover:text-[#1D0DF3] transition-colors"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">Add New Address</span>
        </button>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#EFEFEF]">
          <button
            type="button"
            className="px-6 py-2.5 text-sm font-medium text-[#292929] border border-[#DCDCDC] rounded-lg hover:bg-[#F8F8F8] transition-colors"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 text-sm font-medium text-white bg-[#1D0DF3] rounded-lg hover:bg-[#1a0bd9] transition-colors"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Save Addresses
          </button>
        </div>
      </div>
    </div>
  )
}

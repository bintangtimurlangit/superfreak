'use client'

import { useState, useMemo } from 'react'
import { MapPin, Search, X, Check, Plus, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { SavedAddress } from '@/lib/types'
import { useSession } from '@/lib/auth/client'
import { useQuery } from '@tanstack/react-query'

interface AddressSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (address: SavedAddress) => void
  selectedAddressId?: string
}

export default function AddressSelectionModal({
  isOpen,
  onClose,
  onSelect,
  selectedAddressId,
}: AddressSelectionModalProps) {
  const { data: sessionData } = useSession()
  const user = sessionData?.user || null
  const [searchQuery, setSearchQuery] = useState('')

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const response = await fetch(`/api/user-addresses`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch addresses')
      const data = await response.json()
      return data.docs || []
    },
    enabled: !!user?.id && isOpen,
  })

  const filteredAddresses = useMemo(() => {
    if (!searchQuery.trim()) return addresses
    const query = searchQuery.toLowerCase()
    return addresses.filter((address: SavedAddress) => {
      const recipientMatch = address.recipientName.toLowerCase().includes(query)
      const addressMatch =
        address.addressLine1.toLowerCase().includes(query) ||
        address.addressLine2?.toLowerCase().includes(query) ||
        address.provinceName?.toLowerCase().includes(query) ||
        address.regencyName?.toLowerCase().includes(query) ||
        address.rajaOngkirProvinceName?.toLowerCase().includes(query) ||
        address.rajaOngkirCityName?.toLowerCase().includes(query) ||
        address.rajaOngkirDistrictName?.toLowerCase().includes(query) ||
        address.rajaOngkirSubdistrictName?.toLowerCase().includes(query)
      return recipientMatch || addressMatch
    })
  }, [addresses, searchQuery])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EFEFEF] flex items-center justify-between bg-gray-50/50">
          <div>
            <h2
              className="text-lg font-bold text-[#292929]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Select Shipping Address
            </h2>
            <p className="text-xs text-[#7C7C7C]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
              Choose an address for your delivery
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-[#292929]" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-[#EFEFEF]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#989898]" />
            <input
              type="text"
              placeholder="Search by name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8F8F8] border border-[#EFEFEF] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent transition-all"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            />
          </div>
        </div>

        {/* Address List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#989898]">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm">Loading addresses...</p>
            </div>
          ) : filteredAddresses.length > 0 ? (
            filteredAddresses.map((address: SavedAddress) => {
              const isSelected = selectedAddressId === address.id
              return (
                <button
                  key={address.id}
                  onClick={() => onSelect(address)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3 group ${
                    isSelected
                      ? 'border-[#1D0DF3] bg-[#1D0DF3]/5 ring-1 ring-[#1D0DF3]'
                      : 'border-[#EFEFEF] hover:border-[#DCDCDC] bg-white'
                  }`}
                >
                  <div
                    className={`mt-0.5 p-2 rounded-lg ${isSelected ? 'bg-[#1D0DF3] text-white' : 'bg-gray-100 text-[#7C7C7C]'}`}
                  >
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className="font-semibold text-[#292929] text-sm truncate"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        {address.recipientName}
                      </h4>
                      {address.isDefault && (
                        <span
                          className="px-1.5 py-0.5 text-[10px] font-medium text-[#1D0DF3] bg-blue-50 rounded"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          Default
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs text-[#989898] mb-1 truncate"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      {address.phoneNumber}
                    </p>
                    <p
                      className="text-xs text-[#292929] leading-relaxed line-clamp-2"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      {[
                        address.addressLine1,
                        address.addressLine2,
                        address.rajaOngkirSubdistrictName || address.villageName,
                        address.rajaOngkirDistrictName || address.districtName,
                        address.rajaOngkirCityName || address.regencyName,
                        address.rajaOngkirProvinceName || address.provinceName,
                        address.postalCode,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="bg-[#1D0DF3] text-white p-1 rounded-full flex-shrink-0 self-center">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              )
            })
          ) : (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-[#EFEFEF] mx-auto mb-3" />
              <p
                className="text-[#989898] text-sm"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                {searchQuery ? 'No addresses match your search' : 'No addresses saved yet'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-[#EFEFEF] flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-[#1D0DF3] hover:bg-blue-50"
            onClick={() => {
              window.open('/profile/address', '_blank')
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Manage Addresses
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

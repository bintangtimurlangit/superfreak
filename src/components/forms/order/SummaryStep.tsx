'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronRight, MapPin, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { useSession } from '@/hooks/useSession'
import type { UploadedFile } from './UploadStep'

interface Province {
  code: string
  name: string
}

interface Regency {
  code: string
  name: string
}

interface District {
  code: string
  name: string
}

interface Village {
  code: string
  name: string
}

interface Address {
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
}

interface PrintingPricing {
  id: string
  filamentType: string | { id: string; name: string }
  pricingTable: Array<{
    layerHeight: number
    pricePerGram: number
  }>
  isActive: boolean
}

interface FilePrice {
  fileId: string
  weight: number
  pricePerGram: number
  quantity: number
  totalPrice: number
}

interface SummaryStepProps {
  uploadedFiles: UploadedFile[]
  onBack: () => void
  onNext: () => void
}

export default function SummaryStep({ uploadedFiles, onBack, onNext }: SummaryStepProps) {
  const router = useRouter()
  const { user, loading: sessionLoading } = useSession()
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null)
  const [loading, setLoading] = useState(true)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [pricingData, setPricingData] = useState<PrintingPricing[]>([])
  const [filePrices, setFilePrices] = useState<FilePrice[]>([])
  const [totalWeight, setTotalWeight] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await fetch('/api/wilayah/provinces')
        if (response.ok) {
          const data = await response.json()
          setProvinces(data)
        }
      } catch (error) {
        console.error('Error fetching provinces:', error)
      }
    }
    fetchProvinces()
  }, [])

  // Fetch pricing data
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch(
          '/api/printing-pricing?where[isActive][equals]=true&limit=100&depth=1',
        )
        if (response.ok) {
          const data = await response.json()
          setPricingData(data.docs || [])
        }
      } catch (error) {
        console.error('Error fetching pricing data:', error)
      }
    }
    fetchPricing()
  }, [])

  // Calculate prices for each file
  useEffect(() => {
    const completedFiles = uploadedFiles.filter((file) => file.status === 'completed')
    const prices: FilePrice[] = []
    let totalWeightGrams = 0
    let totalPriceRp = 0

    completedFiles.forEach((file) => {
      if (!file.statistics || !file.configuration) return

      const material = file.configuration.material
      const layerHeight = parseFloat(file.configuration.layerHeight || '0')
      const quantity = file.configuration.quantity || 1
      const weightPerUnit = file.statistics.filament_weight_g || 0
      const totalWeightForFile = weightPerUnit * quantity

      // Find pricing for this filament type and layer height
      const pricing = pricingData.find((p) => {
        if (typeof p.filamentType === 'string') {
          // If it's just an ID, we can't match by name - skip for now
          // In a real scenario, you'd need to fetch the filament type details
          return false
        }
        const filamentName = (p.filamentType as { name: string }).name
        return filamentName === material
      })

      if (pricing) {
        // Find the price for this layer height
        const priceRow = pricing.pricingTable.find(
          (row) => Math.abs(row.layerHeight - layerHeight) < 0.001,
        )

        if (priceRow) {
          const pricePerGram = priceRow.pricePerGram
          const fileTotalPrice = totalWeightForFile * pricePerGram

          prices.push({
            fileId: file.id,
            weight: totalWeightForFile,
            pricePerGram,
            quantity,
            totalPrice: fileTotalPrice,
          })

          totalWeightGrams += totalWeightForFile
          totalPriceRp += fileTotalPrice
        }
      }
    })

    setFilePrices(prices)
    setTotalWeight(totalWeightGrams)
    setTotalPrice(totalPriceRp)
  }, [uploadedFiles, pricingData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatWeight = (grams: number) => {
    if (grams >= 1000) {
      return `${(grams / 1000).toFixed(2)} kg`
    }
    return `${grams.toFixed(2)} g`
  }

  const formatAddress = useCallback((address: Address) => {
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
  }, [])

  const fetchDefaultAddress = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      const queryParams = new URLSearchParams({
        'where[user][equals]': user.id,
        'where[isDefault][equals]': 'true',
      })
      const response = await fetch(`/api/addresses?${queryParams.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.docs && data.docs.length > 0) {
          const address = data.docs[0]

          let regencyName = ''
          let districtName = ''
          let villageName = ''

          if (address.provinceCode && address.regencyCode) {
            try {
              const regencyResponse = await fetch(`/api/wilayah/regencies/${address.provinceCode}`)
              if (regencyResponse.ok) {
                const regencies = await regencyResponse.json()
                const regency = regencies.find((r: Regency) => r.code === address.regencyCode)
                regencyName = regency?.name || ''

                if (address.districtCode) {
                  const districtResponse = await fetch(
                    `/api/wilayah/districts/${address.regencyCode}`,
                  )
                  if (districtResponse.ok) {
                    const districts = await districtResponse.json()
                    const district = districts.find(
                      (d: District) => d.code === address.districtCode,
                    )
                    districtName = district?.name || ''

                    if (address.villageCode) {
                      const villageResponse = await fetch(
                        `/api/wilayah/villages/${address.districtCode}`,
                      )
                      if (villageResponse.ok) {
                        const villages = await villageResponse.json()
                        const village = villages.find(
                          (v: Village) => v.code === address.villageCode,
                        )
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

          const province = provinces.find((p) => p.code === address.provinceCode)

          setDefaultAddress({
            ...address,
            provinceName: province?.name || '',
            regencyName,
            districtName,
            villageName,
          })
        } else {
          setDefaultAddress(null)
        }
      }
    } catch (error) {
      console.error('Error fetching default address:', error)
      setDefaultAddress(null)
    } finally {
      setLoading(false)
    }
  }, [user?.id, provinces, formatAddress])

  useEffect(() => {
    if (user?.id && provinces.length > 0) {
      fetchDefaultAddress()
    } else if (!sessionLoading) {
      setLoading(false)
    }
  }, [user?.id, provinces.length, fetchDefaultAddress, sessionLoading])

  const hasAddress = defaultAddress !== null
  return (
    <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 md:p-6">
      <div className="mb-6">
        <h2
          className="text-[24px] font-semibold text-[#292929] mb-2"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          Order Summary
        </h2>
        <p className="text-sm text-[#7C7C7C]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
          Review your order details before proceeding to payment.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {uploadedFiles
          .filter((file) => file.status === 'completed')
          .map((file) => (
            <div key={file.id} className="border border-[#EFEFEF] rounded-[12px] p-4 bg-[#F8F8F8]">
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    className="text-base font-semibold text-[#292929] mb-1"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    {file.name}
                  </h3>
                  <div className="space-y-1">
                    <p
                      className="text-xs text-[#7C7C7C]"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      Material: {file.configuration?.material || 'Not selected'}
                    </p>
                    <p
                      className="text-xs text-[#7C7C7C]"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      Color: {file.configuration?.color || 'Not selected'}
                    </p>
                    <p
                      className="text-xs text-[#7C7C7C]"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      Quantity: {file.configuration?.quantity || 1} pcs
                    </p>
                    {file.statistics && (
                      <>
                        <p
                          className="text-xs text-[#7C7C7C]"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          Weight: {formatWeight(file.statistics.filament_weight_g || 0)} per unit
                        </p>
                        <p
                          className="text-xs text-[#7C7C7C]"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          Layer Height: {file.configuration?.layerHeight || '-'} mm
                        </p>
                        <p
                          className="text-xs text-[#7C7C7C]"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          Infill: {file.configuration?.infill || '-'}
                        </p>
                        <p
                          className="text-xs text-[#7C7C7C]"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          Wall Count: {file.configuration?.wallCount || '2'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {(() => {
                    const filePrice = filePrices.find((fp) => fp.fileId === file.id)
                    return filePrice ? (
                      <>
                        <p
                          className="text-base font-semibold text-[#292929]"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          {formatCurrency(filePrice.totalPrice)}
                        </p>
                        <p
                          className="text-xs text-[#7C7C7C] mt-1"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          {formatWeight(filePrice.weight)} @{' '}
                          {formatCurrency(filePrice.pricePerGram)}/g
                        </p>
                      </>
                    ) : (
                      <p
                        className="text-sm text-[#7C7C7C]"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        Calculating...
                      </p>
                    )
                  })()}
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="border-t border-[#EFEFEF] pt-4 mb-6">
        <div className="mb-4">
          <h3
            className="text-base font-semibold text-[#292929] mb-3"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Shipping Address
          </h3>
          {loading ? (
            <div className="border border-[#EFEFEF] rounded-[12px] p-4 bg-[#F8F8F8]">
              <p
                className="text-sm text-[#7C7C7C]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Loading address...
              </p>
            </div>
          ) : hasAddress ? (
            <div className="border border-[#EFEFEF] rounded-[12px] p-4 bg-[#F8F8F8]">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#1D0DF3] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4
                      className="font-semibold text-[#292929] text-sm"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      {defaultAddress.recipientName}
                    </h4>
                    <span
                      className="px-2 py-0.5 text-xs font-medium text-[#1D0DF3] bg-blue-50 rounded"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      Default
                    </span>
                  </div>
                  <p
                    className="text-xs text-[#989898] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    {defaultAddress.phoneNumber}
                  </p>
                  <p
                    className="text-xs text-[#292929] leading-relaxed"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    {formatAddress(defaultAddress)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-orange-200 rounded-[12px] p-4 bg-orange-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p
                    className="text-sm text-orange-800 mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Oops! You haven&apos;t set your address yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/profile/address')}
                    className="text-sm font-medium text-[#1D0DF3] hover:underline"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Go to Address Information →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[#7C7C7C]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
            Total Weight
          </span>
          <span
            className="text-sm font-medium text-[#292929]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            {formatWeight(totalWeight)}
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[#7C7C7C]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
            Subtotal
          </span>
          <span
            className="text-sm font-medium text-[#292929]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            {formatCurrency(totalPrice)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span
            className="text-base font-semibold text-[#292929]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Total
          </span>
          <span
            className="text-base font-semibold text-[#292929]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            {formatCurrency(totalPrice)}
          </span>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-[#EFEFEF]">
        <Button onClick={onBack} variant="secondary" className="h-11 px-6 rounded-[12px] text-sm">
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!hasAddress}
          className="h-11 px-6 gap-2 rounded-[12px] border border-[#1D0DF3] !bg-[#1D0DF3] text-white hover:!bg-[#1a0bd4] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:!bg-[#1D0DF3]"
        >
          Proceed to Payment
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

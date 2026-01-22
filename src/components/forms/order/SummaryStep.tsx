'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronRight, ChevronDown, MapPin, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { useSession } from '@/lib/auth/client'
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
  rajaOngkirDestinationId?: number
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
  const { data: sessionData, isPending: sessionLoading } = useSession()
  const user = sessionData?.user || null
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null)
  const [loading, setLoading] = useState(true)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [pricingData, setPricingData] = useState<PrintingPricing[]>([])
  const [filePrices, setFilePrices] = useState<FilePrice[]>([])
  const [totalWeight, setTotalWeight] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)
  const [shippingCost, setShippingCost] = useState(0)
  const [selectedCourier, setSelectedCourier] = useState<string>('')
  const [selectedService, setSelectedService] = useState<string>('')
  const [availableCouriers, setAvailableCouriers] = useState<string[]>([])
  const [shippingServices, setShippingServices] = useState<any[]>([])
  const [loadingShipping, setLoadingShipping] = useState(false)
  const [isCourierDropdownOpen, setIsCourierDropdownOpen] = useState(false)
  const courierDropdownRef = useRef<HTMLDivElement>(null)

  // Close courier dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (courierDropdownRef.current && !courierDropdownRef.current.contains(target)) {
        setIsCourierDropdownOpen(false)
      }
    }

    if (isCourierDropdownOpen) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside, true)
      }, 100)

      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('click', handleClickOutside, true)
      }
    }
  }, [isCourierDropdownOpen])

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

  // Fetch available couriers from settings
  useEffect(() => {
    const fetchCourierSettings = async () => {
      try {
        const response = await fetch('/api/globals/courier-settings')
        if (response.ok) {
          const data = await response.json()
          const couriers = data.enabledCouriers || ['jne', 'jnt', 'sicepat']
          setAvailableCouriers(couriers)
          // Set first courier as default
          if (couriers.length > 0 && !selectedCourier) {
            setSelectedCourier(couriers[0])
          }
        }
      } catch (error) {
        console.error('Error fetching courier settings:', error)
        // Fallback to default couriers
        setAvailableCouriers(['jne', 'jnt', 'sicepat'])
        setSelectedCourier('jne')
      }
    }
    fetchCourierSettings()
  }, [selectedCourier])

  // Calculate shipping cost when address, weight, and courier are available
  useEffect(() => {
    const calculateShipping = async () => {
      if (!defaultAddress || !totalWeight || !selectedCourier) {
        setShippingServices([])
        setShippingCost(0)
        return
      }

      // Check if address has RajaOngkir destination ID
      const rajaOngkirId = (defaultAddress as any).rajaOngkirDestinationId
      if (!rajaOngkirId) {
        console.warn('Address does not have RajaOngkir destination ID')
        return
      }

      setLoadingShipping(true)
      try {
        const { calculateShippingCost, calculateShippingWeight } = await import('@/lib/rajaongkir')

        // Calculate adjusted weight (add 300g if < 300g)
        const adjustedWeight = calculateShippingWeight(totalWeight)

        const result = await calculateShippingCost(rajaOngkirId, adjustedWeight, selectedCourier)

        console.log('Frontend received result:', result)
        console.log('Result.data:', result.data)

        if (result.data && Array.isArray(result.data) && result.data.length > 0) {
          // Filter out heavy cargo services for shipments under 10kg
          const heavyCargoServices = ['JTR', 'GOKIL']
          const filteredServices =
            adjustedWeight < 10000
              ? result.data.filter((service) => {
                  // Check if service code contains any heavy cargo keywords
                  const serviceCode = service.service.toUpperCase()
                  return !heavyCargoServices.some((keyword) => serviceCode.includes(keyword))
                })
              : result.data

          setShippingServices(filteredServices)
          // Auto-select first service if none selected
          const firstService = filteredServices[0]
          if (!selectedService && firstService) {
            setSelectedService(firstService.service)
            setShippingCost(firstService.cost)
          }
        } else {
          console.warn('⚠️ No services data in response:', result)
        }
      } catch (error) {
        console.error('Error calculating shipping cost:', error)
        setShippingServices([])
        setShippingCost(0)
      } finally {
        setLoadingShipping(false)
      }
    }

    calculateShipping()
  }, [defaultAddress, totalWeight, selectedCourier, selectedService])

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
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Column - Order Items & Address */}
      <div className="flex-1 space-y-4">
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

          {/* Order Items */}
          <div className="space-y-3">
            {uploadedFiles
              .filter((file) => file.status === 'completed')
              .map((file) => (
                <div
                  key={file.id}
                  className="border border-[#EFEFEF] rounded-[12px] p-4 bg-[#F8F8F8]"
                >
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
                              Weight: {formatWeight(file.statistics.filament_weight_g || 0)} per
                              unit
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

          {/* Shipping Address - Inside Container */}
          <div className="border-t border-[#EFEFEF] pt-4 mt-4">
            <h3
              className="text-base font-semibold text-[#292929] mb-3"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Shipping Address
            </h3>
            {loading ? (
              <p
                className="text-sm text-[#7C7C7C]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Loading address...
              </p>
            ) : hasAddress ? (
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <MapPin className="h-5 w-5 text-[#1D0DF3] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4
                      className="font-semibold text-[#292929] text-sm mb-1"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      {defaultAddress.recipientName}
                    </h4>
                    <p
                      className="text-xs text-[#989898] mb-1"
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
                <button
                  type="button"
                  onClick={() => router.push('/profile/address')}
                  className="text-sm font-medium text-[#1D0DF3] hover:underline ml-4"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="border border-orange-200 rounded-lg p-3 bg-orange-50">
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

          {/* Back Button */}
          <div className="flex justify-start pt-6 border-t border-[#EFEFEF] mt-6">
            <Button
              onClick={onBack}
              variant="secondary"
              className="h-11 px-6 rounded-[12px] text-sm"
            >
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column - Summary Sidebar */}
      <div className="lg:w-[400px]">
        <div className="lg:sticky lg:top-6">
          <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-5 space-y-4">
            {/* Order Summary Section */}
            <div>
              <h3
                className="text-base font-semibold text-[#292929] mb-3"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Order Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#7C7C7C]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                    Items ({uploadedFiles.filter((f) => f.status === 'completed').length})
                  </span>
                  <span
                    className="text-[#292929] font-medium"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    {formatWeight(totalWeight)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium pt-2 border-t border-[#DCDCDC]">
                  <span className="text-[#292929]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                    Subtotal
                  </span>
                  <span className="text-[#292929]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Ship To Section */}
            {hasAddress && (
              <div className="border-t border-[#DCDCDC] pt-4">
                <h4
                  className="text-sm font-medium text-[#292929] mb-2"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Ship To
                </h4>
                <p
                  className="text-sm text-[#292929] font-medium"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  {defaultAddress.recipientName}
                </p>
                <p
                  className="text-xs text-[#7C7C7C] mt-1"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  {defaultAddress.regencyName}, {defaultAddress.postalCode}
                </p>
              </div>
            )}

            {/* Shipping Method Section */}

            {hasAddress && (
              <div className="border-t border-[#DCDCDC] pt-4">
                <h4
                  className="text-sm font-medium text-[#292929] mb-3"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Shipping Method
                </h4>

                {loadingShipping ? (
                  <div className="text-sm text-[#7C7C7C] py-2">Calculating shipping cost...</div>
                ) : shippingServices.length > 0 ? (
                  <div className="space-y-2">
                    {shippingServices.map((service) => (
                      <label
                        key={service.service}
                        className="flex items-center justify-between p-3 border border-[#DCDCDC] rounded-lg cursor-pointer hover:bg-white hover:border-[#1D0DF3] transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="radio"
                            name="shipping"
                            value={service.service}
                            checked={selectedService === service.service}
                            onChange={(e) => {
                              setSelectedService(e.target.value)
                              setShippingCost(service.cost)
                            }}
                            className="w-4 h-4 text-[#1D0DF3] border-gray-300 focus:ring-[#1D0DF3]"
                          />
                          <div className="flex-1">
                            <div
                              className="text-sm font-medium text-[#292929]"
                              style={{ fontFamily: 'var(--font-geist-sans)' }}
                            >
                              {service.code.toUpperCase()} - {service.service}
                            </div>
                            <div
                              className="text-xs text-[#7C7C7C]"
                              style={{ fontFamily: 'var(--font-geist-sans)' }}
                            >
                              {service.etd}
                            </div>
                          </div>
                        </div>
                        <div
                          className="text-sm font-medium text-[#292929]"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          {formatCurrency(service.cost)}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : selectedCourier ? (
                  <div className="text-sm text-orange-600 py-2">
                    Shipping cost unavailable. Please ensure your address has complete location
                    data.
                  </div>
                ) : (
                  <div className="text-sm text-[#7C7C7C] py-2">
                    Select a courier to see available shipping options.
                  </div>
                )}

                {/* Courier Selection - Dropdown */}
                {availableCouriers.length > 0 && (
                  <div className="mt-3 relative" ref={courierDropdownRef}>
                    <label
                      className="block text-xs text-[#7C7C7C] mb-2"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      Change Courier
                    </label>
                    <Button
                      variant="secondary"
                      className="w-full text-sm !justify-start"
                      onClick={() => setIsCourierDropdownOpen(!isCourierDropdownOpen)}
                    >
                      <span>{selectedCourier.toUpperCase()}</span>
                      <ChevronDown
                        className={`h-4 w-4 ml-auto transition-transform ${isCourierDropdownOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </Button>
                    {isCourierDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 w-full bg-white border border-[#EFEFEF] rounded-lg shadow-lg z-50">
                        {availableCouriers.map((courier) => (
                          <button
                            key={courier}
                            onClick={() => {
                              setSelectedCourier(courier)
                              setSelectedService('')
                              setShippingCost(0)
                              setIsCourierDropdownOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f5f5f5] transition-colors ${
                              selectedCourier === courier
                                ? 'bg-[#f5f5f5] font-medium'
                                : 'text-[#292929]'
                            }`}
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            {courier.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Total Section */}
            <div className="border-t border-[#DCDCDC] pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#7C7C7C]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                  Subtotal
                </span>
                <span className="text-[#292929]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                  {formatCurrency(totalPrice)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7C7C7C]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                  Shipping
                </span>
                <span className="text-[#292929]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                  {shippingCost > 0 ? formatCurrency(shippingCost) : '-'}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#DCDCDC]">
                <span className="text-[#292929]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                  Total
                </span>
                <span className="text-[#292929]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                  {formatCurrency(totalPrice + shippingCost)}
                </span>
              </div>
            </div>

            {/* Proceed Button */}
            <Button
              onClick={onNext}
              disabled={!hasAddress}
              className="w-full h-11 gap-2 rounded-[12px] border border-[#1D0DF3] !bg-[#1D0DF3] text-white hover:!bg-[#1a0bd4] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:!bg-[#1D0DF3]"
            >
              Proceed to Payment
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

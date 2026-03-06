'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Pencil } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { UploadedFile } from './UploadStep'
import type { FilePrice } from './SummaryStep'

interface PrintingPricing {
  id: string
  filamentType: string | { id: string; name: string }
  pricingTable: Array<{
    layerHeight: number
    pricePerGram: number
  }>
  isActive: boolean
}

interface ReviewStepProps {
  uploadedFiles: UploadedFile[]
  onBack: () => void
  onNext: () => void
  onConfigure: (fileId: string) => void
}

export default function ReviewStep({
  uploadedFiles,
  onBack,
  onNext,
  onConfigure,
}: ReviewStepProps) {
  const [pricingData, setPricingData] = useState<PrintingPricing[]>([])
  const [filePrices, setFilePrices] = useState<FilePrice[]>([])
  const [totalWeight, setTotalWeight] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)

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

      const pricing = pricingData.find((p) => {
        if (typeof p.filamentType === 'string') return false
        const filamentName = (p.filamentType as { name: string }).name
        return filamentName === material
      })

      if (pricing) {
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

  const completedFiles = uploadedFiles.filter((f) => f.status === 'completed')

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-4">
        <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 md:p-6">
          <div className="mb-6">
            <h2
              className="text-[24px] font-semibold text-[#292929] mb-2"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Review your models
            </h2>
            <p className="text-sm text-[#7C7C7C]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
              Edit print settings and see gramasi and print cost. Shipping will be added in the next
              step.
            </p>
          </div>

          <div className="space-y-3">
            {completedFiles.map((file) => (
              <div
                key={file.id}
                className="border border-[#EFEFEF] rounded-[12px] p-4 bg-[#F8F8F8]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
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
                  <div className="flex items-start gap-3 flex-shrink-0">
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
                        ) : !file.statistics ? (
                          <p
                            className="text-sm text-amber-600"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            Re-calculate needed
                          </p>
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
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-9 px-3 gap-1.5 rounded-[10px] text-xs"
                      onClick={() => onConfigure(file.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

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

      <div className="lg:w-[400px]">
        <div className="lg:sticky lg:top-6">
          <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-5 space-y-4">
            <div>
              <h3
                className="text-base font-semibold text-[#292929] mb-3"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Print cost
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#7C7C7C]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                    Items ({completedFiles.length})
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
                    Subtotal (print only)
                  </span>
                  <span className="text-[#292929]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
                <p
                  className="text-xs text-[#7C7C7C] pt-1"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Shipping will be added in Order Summary.
                </p>
              </div>
            </div>

            <Button
              onClick={onNext}
              className="w-full h-11 px-6 gap-2 rounded-[12px] border border-[#1D0DF3] !bg-[#1D0DF3] text-white hover:!bg-[#1a0bd4] text-sm font-medium"
            >
              Proceed to Order Summary
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Pencil, Box, Plus, Minus, CopyPlus, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import ModelViewer from '@/components/3d/ModelViewer'
import type { UploadedFile } from './UploadStep'
import type { FilePrice } from './SummaryStep'
import { fetchPrintingData } from '@/lib/printing-data'

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
  onQuantityChange?: (fileId: string, quantity: number) => void
  onDuplicateFile?: (fileId: string) => void
  onRemoveFile?: (fileId: string) => void
}

export default function ReviewStep({
  uploadedFiles,
  onBack,
  onNext,
  onConfigure,
  onQuantityChange,
  onDuplicateFile,
  onRemoveFile,
}: ReviewStepProps) {
  const [pricingData, setPricingData] = useState<PrintingPricing[]>([])
  const [filePrices, setFilePrices] = useState<FilePrice[]>([])
  const [totalWeight, setTotalWeight] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const sources = await fetchPrintingData()
        setPricingData(sources.pricing.docs || [])
      } catch (error) {
        console.error('Error fetching pricing data:', error)
      }
    }

    load()
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

          <div className="space-y-4">
            {completedFiles.map((file) => {
              const filePrice = filePrices.find((fp) => fp.fileId === file.id)
              const qty = file.configuration?.quantity || 1
              return (
                <div
                  key={file.id}
                  className="relative overflow-hidden rounded-[16px] border border-[#E5E5E5] bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Top bar: name + price + remove */}
                  <div className="flex items-center justify-between gap-4 border-b border-[#F0F0F0] px-4 py-3 bg-[#FAFAFA]">
                    <h3
                      className="min-w-0 truncate text-sm font-semibold text-[#292929]"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                      title={file.name}
                    >
                      {file.name}
                    </h3>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {filePrice ? (
                        <div className="text-right">
                          <p
                            className="text-sm font-semibold text-[#1D0DF3]"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            {formatCurrency(filePrice.totalPrice)}
                          </p>
                          <p
                            className="text-[11px] text-[#7C7C7C]"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            {formatWeight(filePrice.weight)} @ {formatCurrency(filePrice.pricePerGram)}/g
                          </p>
                        </div>
                      ) : !file.statistics ? (
                        <span className="text-xs font-medium text-amber-600">Re-calculate needed</span>
                      ) : (
                        <span className="text-xs text-[#7C7C7C]">Calculating...</span>
                      )}
                      {onRemoveFile && (
                        <button
                          type="button"
                          onClick={() => onRemoveFile(file.id)}
                          className="p-2 rounded-[10px] text-[#9CA3AF] hover:bg-[#EFEFEF] hover:text-[#292929] transition-colors"
                          aria-label="Remove model"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body: preview | specs | quantity + actions */}
                  <div className="flex flex-col sm:flex-row gap-4 p-4">
                    {/* 3D preview */}
                    <div className="flex-shrink-0 w-full sm:w-32 h-32 bg-[#F8F8F8] rounded-[12px] border border-[#EEEEEE] overflow-hidden">
                      {file.file ? (
                        <ModelViewer
                          file={file.file}
                          className="w-full h-full"
                          showControls={false}
                          color={(file.configuration as { colorHex?: string })?.colorHex}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Box className="h-12 w-12 text-[#DCDCDC]" />
                        </div>
                      )}
                    </div>

                    {/* Specs grid */}
                    <div className="flex-1 min-w-0">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                        <div>
                          <span className="text-[#9CA3AF]" style={{ fontFamily: 'var(--font-geist-sans)' }}>Material</span>
                          <p className="font-medium text-[#292929]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                            {file.configuration?.material || '–'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[#9CA3AF]" style={{ fontFamily: 'var(--font-geist-sans)' }}>Color</span>
                          <p className="font-medium text-[#292929]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                            {file.configuration?.color || '–'}
                          </p>
                        </div>
                        {file.statistics && (
                          <div>
                            <span
                              className="text-[#9CA3AF]"
                              style={{ fontFamily: 'var(--font-geist-sans)' }}
                            >
                              Weight/unit
                            </span>
                            <p
                              className="font-medium text-[#292929]"
                              style={{ fontFamily: 'var(--font-geist-sans)' }}
                            >
                              {formatWeight(file.statistics.filament_weight_g || 0)}
                            </p>
                          </div>
                        )}
                        <div>
                          <span
                            className="text-[#9CA3AF]"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            Layer
                          </span>
                          <p
                            className="font-medium text-[#292929]"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            {file.configuration?.layerHeight || '–'} mm
                          </p>
                        </div>
                        <div>
                          <span
                            className="text-[#9CA3AF]"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            Infill
                          </span>
                          <p
                            className="font-medium text-[#292929]"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            {file.configuration?.infill || '–'}
                          </p>
                        </div>
                        <div>
                          <span
                            className="text-[#9CA3AF]"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            Walls
                          </span>
                          <p
                            className="font-medium text-[#292929]"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            {file.configuration?.wallCount || '2'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quantity + actions */}
                    <div className="flex flex-col sm:items-end justify-between gap-3 flex-shrink-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#7C7C7C]" style={{ fontFamily: 'var(--font-geist-sans)' }}>Qty</span>
                        {onQuantityChange ? (
                          <div className="flex items-center border border-[#E5E5E5] rounded-[10px] bg-[#FAFAFA] overflow-hidden">
                            <button
                              type="button"
                              onClick={() => onQuantityChange(file.id, qty - 1)}
                              className="p-2 hover:bg-[#EFEFEF] transition-colors disabled:opacity-40"
                              aria-label="Decrease quantity"
                              disabled={qty <= 1}
                            >
                              <Minus className="h-4 w-4 text-[#292929]" />
                            </button>
                            <span
                              className="w-8 text-center text-sm font-semibold text-[#292929]"
                              style={{ fontFamily: 'var(--font-geist-sans)' }}
                            >
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => onQuantityChange(file.id, qty + 1)}
                              className="p-2 hover:bg-[#EFEFEF] transition-colors disabled:opacity-40"
                              aria-label="Increase quantity"
                              disabled={qty >= 999}
                            >
                              <Plus className="h-4 w-4 text-[#292929]" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-[#292929]">{qty} pcs</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-9 px-3 gap-1.5 rounded-[10px] text-xs font-medium"
                          onClick={() => onConfigure(file.id)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        {onDuplicateFile && (
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-9 px-3 gap-1.5 rounded-[10px] text-xs font-medium border border-[#E5E5E5] bg-white hover:bg-[#FAFAFA]"
                            onClick={() => onDuplicateFile(file.id)}
                          >
                            <CopyPlus className="h-3.5 w-3.5" />
                            Add variant
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
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

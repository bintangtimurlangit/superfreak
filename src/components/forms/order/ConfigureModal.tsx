'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Info, ChevronRight, ChevronLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { UploadedFile } from './UploadStep'
import { modelConfigurationSchema, type ModelConfigurationFormData } from '@/lib/validations/order'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import type { FilamentType, PrintingOption, PrintingPricing } from '@/payload-types'
import ModelViewer from '@/components/3d/ModelViewer'

interface ConfigureModalProps {
  isOpen: boolean
  onClose: () => void
  file: UploadedFile | null
  onSave: (fileId: string, configuration: ModelConfigurationFormData) => void
}

interface PrintingOptionsData {
  materials: string[]
  colors: string[]
  layerHeights: string[]
  infill: Array<{ label: string; value: string }>
  maxWallCount: number
}

interface PayloadResponse<T> {
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page?: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage?: number | null
  nextPage?: number | null
}

// Info tooltip component
function InfoTooltip({ content }: { content: string }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="relative inline-block ml-1.5">
      <Info
        className="h-4 w-4 text-[#7C7C7C] cursor-help"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {isHovered && (
        <div
          className="absolute z-[100] left-1/2 -translate-x-1/2 top-full mt-2 w-56 p-2.5 bg-[#292929] text-white text-xs leading-relaxed rounded-[8px] shadow-lg pointer-events-none"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          {content}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-[#292929]"></div>
        </div>
      )}
    </div>
  )
}

export default function ConfigureModal({ isOpen, onClose, file, onSave }: ConfigureModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  // Fetch printing options from Payload REST API
  const { data: printingOptions, isLoading: loadingOptions } = useQuery<PrintingOptionsData>({
    queryKey: ['printing-options'],
    queryFn: async (): Promise<PrintingOptionsData> => {
      // Fetch from Payload's built-in REST API endpoints
      const [filamentTypesRes, printingOptionsRes, pricingRes] = await Promise.all([
        fetch('/api/filament-types?where[isActive][equals]=true&limit=100&sort=name'),
        fetch('/api/printing-options?where[isActive][equals]=true&limit=100&sort=type'),
        fetch('/api/printing-pricing?where[isActive][equals]=true&limit=100'),
      ])

      if (!filamentTypesRes.ok || !printingOptionsRes.ok || !pricingRes.ok) {
        throw new Error('Failed to fetch printing options')
      }

      const [filamentTypes, printingOptions, pricing] = await Promise.all([
        filamentTypesRes.json() as Promise<PayloadResponse<FilamentType>>,
        printingOptionsRes.json() as Promise<PayloadResponse<PrintingOption>>,
        pricingRes.json() as Promise<PayloadResponse<PrintingPricing>>,
      ])

      // Extract unique layer heights from pricing tables
      const layerHeights = new Set<number>()
      pricing.docs?.forEach((priceDoc) => {
        if (priceDoc.pricingTable && Array.isArray(priceDoc.pricingTable)) {
          priceDoc.pricingTable.forEach((row) => {
            if (row.layerHeight != null && typeof row.layerHeight === 'number') {
              layerHeights.add(row.layerHeight)
            }
          })
        }
      })

      // Organize data
      const materials = (filamentTypes.docs?.map((doc) => doc.name).filter(Boolean) ||
        []) as string[]

      // Get all colors from all filament types
      const allColors = new Set<string>()
      filamentTypes.docs?.forEach((doc) => {
        if (doc.colors && Array.isArray(doc.colors)) {
          doc.colors.forEach((color) => {
            if (color.name) {
              allColors.add(color.name)
            }
          })
        }
      })

      // Organize printing options by type
      const optionsByType: Record<string, Array<{ label: string; value: string }>> = {}
      printingOptions.docs?.forEach((doc) => {
        if (doc.values && Array.isArray(doc.values)) {
          optionsByType[doc.type || ''] = doc.values
            .filter((val) => val.isActive !== false)
            .map((val) => ({
              label: val.label || '',
              value: val.value || '',
            }))
        }
      })

      // Get wall count max value
      const wallCountOption = printingOptions.docs?.find((doc) => doc.type === 'wallCount')
      const maxWallCount = (wallCountOption?.maxValue as number) || 20

      return {
        materials: Array.from(materials).sort(),
        colors: Array.from(allColors).sort(),
        layerHeights: Array.from(layerHeights)
          .sort((a, b) => a - b)
          .map((h) => h.toFixed(2)),
        infill: optionsByType.infill || [],
        maxWallCount,
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Extract options from fetched data
  const materialOptions = printingOptions?.materials || []
  const colorOptions = printingOptions?.colors || []
  const layerHeightOptions = printingOptions?.layerHeights || []
  const infillOptions = useMemo(() => printingOptions?.infill || [], [printingOptions?.infill])
  const maxWallCount = printingOptions?.maxWallCount || 20

  // Create dynamic validation schema that checks against available infill values
  const dynamicSchema = useMemo(() => {
    const infillValues = infillOptions.map((opt) => opt.value)
    return modelConfigurationSchema.extend({
      infill: z
        .string()
        .min(1, 'Infill is required')
        .refine((val) => infillValues.includes(val), {
          message: `Infill must be one of the available options: ${infillValues.join(', ')}`,
        }),
    })
  }, [infillOptions])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<ModelConfigurationFormData>({
    resolver: zodResolver(dynamicSchema),
    mode: 'onChange',
    defaultValues: {
      material: '',
      color: '',
      layerHeight: '',
      infill: '',
      wallCount: '2',
      quantity: 1,
      enabled: true,
      specialRequest: '',
    },
  })

  const formData = watch()

  useEffect(() => {
    if (file?.configuration) {
      reset({
        material: file.configuration.material || '',
        color: file.configuration.color || '',
        layerHeight: file.configuration.layerHeight || '',
        infill: file.configuration.infill || '',
        wallCount: file.configuration.wallCount || '2',
        quantity: file.configuration.quantity || 1,
        enabled: file.configuration.enabled ?? true,
        specialRequest: file.configuration.specialRequest || '',
      })
    } else {
      reset({
        material: '',
        color: '',
        layerHeight: '',
        infill: '',
        wallCount: '2',
        quantity: 1,
        enabled: true,
        specialRequest: '',
      })
    }
    setCurrentStep(1) // Reset to first step when modal opens
  }, [file, isOpen, reset])

  const handleNext = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    // Validate current step before proceeding
    if (currentStep === 1) {
      const material = formData.material
      const color = formData.color
      const layerHeight = formData.layerHeight

      if (!material || !color || !layerHeight) {
        // Trigger validation
        setValue('material', material || '', { shouldValidate: true })
        setValue('color', color || '', { shouldValidate: true })
        setValue('layerHeight', layerHeight || '', { shouldValidate: true })
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      const infill = formData.infill

      if (!infill) {
        // Trigger validation
        setValue('infill', infill || '', { shouldValidate: true })
        return
      }
      setCurrentStep(3)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!isOpen || !file) return null

  const onSubmit: SubmitHandler<ModelConfigurationFormData> = (data) => {
    onSave(file.id, data)
    onClose()
  }

  const handleWallCountChange = (value: string) => {
    const num = Number(value)
    if (Number.isNaN(num)) {
      setValue('wallCount', '', { shouldValidate: true })
      return
    }
    const clamped = Math.max(1, Math.min(20, Math.round(num)))
    setValue('wallCount', String(clamped), { shouldValidate: true })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-[20px] border border-[#EFEFEF] w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#EFEFEF] flex-shrink-0">
          <div className="flex-1">
            <h2
              className="text-[24px] font-semibold text-[#292929] mb-2"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Configure Model
            </h2>
            {/* Progress indicator */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`h-2 w-2 rounded-full transition-all ${
                        step <= currentStep
                          ? 'bg-[#1D0DF3] ring-2 ring-[#1D0DF3] ring-offset-2 ring-offset-white'
                          : 'bg-[#DCDCDC]'
                      }`}
                    />
                    {step < totalSteps && (
                      <div
                        className={`h-[2px] w-8 transition-colors ${
                          step < currentStep ? 'bg-[#1D0DF3]' : 'bg-[#DCDCDC]'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <span
                className="text-xs font-medium text-[#7C7C7C]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Step {currentStep} of {totalSteps}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F8F8F8] rounded-[8px] transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-[#292929]" />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto min-h-0">
          <div className="flex gap-8 h-full items-start">
            <div className="hidden md:flex w-[480px] h-[480px] rounded-[16px] border border-[#DCDCDC] bg-white flex-shrink-0 items-center justify-center sticky top-0 overflow-hidden">
              {file?.file ? (
                <ModelViewer file={file.file} className="w-full h-full" />
              ) : (
                <span
                  className="text-xs text-[#7C7C7C] text-center leading-tight"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  3D Preview
                  <br />
                  (No file available)
                </span>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (currentStep === totalSteps) {
                  handleSubmit(onSubmit)(e)
                }
              }}
              className="flex-1 flex flex-col min-h-0"
              id="configure-form"
            >
              <div className="mb-4">
                <p
                  className="text-sm text-[#292929] font-medium"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  {file.name}
                </p>
                <p
                  className="text-xs text-[#7C7C7C] mt-1"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Configure print settings for this model.
                </p>
              </div>

              <div className="space-y-6 flex-1">
                {/* Step 1: Material, Color, Layer Height */}
                {currentStep === 1 && (
                  <>
                    <div>
                      <label
                        className="flex items-center text-sm font-medium text-[#292929] mb-2"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        Material <span className="text-red-500 ml-1">*</span>
                        <InfoTooltip content="Choose the filament type. Different materials have different properties like strength, flexibility, and temperature resistance." />
                      </label>
                      {loadingOptions ? (
                        <div className="flex flex-wrap gap-3">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="h-12 w-20 bg-gray-200 rounded-[12px] animate-pulse"
                            />
                          ))}
                        </div>
                      ) : materialOptions.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {materialOptions.map((option: string) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setValue('material', option, { shouldValidate: true })}
                              className={`px-4 py-3 rounded-[12px] border text-sm font-medium transition-colors ${
                                formData.material === option
                                  ? 'border-[#1D0DF3] bg-[#1D0DF3] text-white'
                                  : 'border-[#EFEFEF] bg-white text-[#292929] hover:bg-[#F8F8F8]'
                              }`}
                              style={{ fontFamily: 'var(--font-geist-sans)' }}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#7C7C7C]">No material options available</p>
                      )}
                      {errors.material && (
                        <p className="mt-1 text-xs text-red-600">{errors.material.message}</p>
                      )}
                    </div>

                    <div>
                      <label
                        className="flex items-center text-sm font-medium text-[#292929] mb-2"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        Color <span className="text-red-500 ml-1">*</span>
                        <InfoTooltip content="Select the filament color. Available colors vary by material." />
                      </label>
                      {loadingOptions ? (
                        <div className="flex flex-wrap gap-3">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="h-12 w-20 bg-gray-200 rounded-[12px] animate-pulse"
                            />
                          ))}
                        </div>
                      ) : colorOptions.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {colorOptions.map((option: string) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setValue('color', option, { shouldValidate: true })}
                              className={`px-4 py-3 rounded-[12px] border text-sm font-medium transition-colors ${
                                formData.color === option
                                  ? 'border-[#1D0DF3] bg-[#1D0DF3] text-white'
                                  : 'border-[#EFEFEF] bg-white text-[#292929] hover:bg-[#F8F8F8]'
                              }`}
                              style={{ fontFamily: 'var(--font-geist-sans)' }}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#7C7C7C]">No color options available</p>
                      )}
                      {errors.color && (
                        <p className="mt-1 text-xs text-red-600">{errors.color.message}</p>
                      )}
                    </div>

                    <div>
                      <label
                        className="flex items-center text-sm font-medium text-[#292929] mb-2"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        Layer Height <span className="text-red-500 ml-1">*</span>
                        <InfoTooltip content="Print resolution. Smaller values (0.12mm) = smoother but slower. Larger values (0.28mm) = faster but more visible layers." />
                      </label>
                      {loadingOptions ? (
                        <div className="grid grid-cols-4 gap-3">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="h-12 bg-gray-200 rounded-[12px] animate-pulse"
                            />
                          ))}
                        </div>
                      ) : layerHeightOptions.length > 0 ? (
                        <div className="grid grid-cols-4 gap-3">
                          {layerHeightOptions.map((height: string) => (
                            <button
                              key={height}
                              type="button"
                              onClick={() =>
                                setValue('layerHeight', height, { shouldValidate: true })
                              }
                              className={`px-4 py-3 rounded-[12px] border text-sm font-medium transition-colors ${
                                formData.layerHeight === height
                                  ? 'border-[#1D0DF3] bg-[#1D0DF3] text-white'
                                  : 'border-[#EFEFEF] bg-white text-[#292929] hover:bg-[#F8F8F8]'
                              }`}
                              style={{ fontFamily: 'var(--font-geist-sans)' }}
                            >
                              {height}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#7C7C7C]">No layer height options available</p>
                      )}
                      {errors.layerHeight && (
                        <p className="mt-1 text-xs text-red-600">{errors.layerHeight.message}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Step 2: Infill, Wall Count */}
                {currentStep === 2 && (
                  <>
                    <div>
                      <label
                        className="flex items-center text-sm font-medium text-[#292929] mb-2"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        Infill <span className="text-red-500 ml-1">*</span>
                        <InfoTooltip content="Internal density. Higher (60-100%) = stronger but heavier. Lower (10-20%) = lighter and faster but weaker." />
                      </label>
                      {loadingOptions ? (
                        <div className="grid grid-cols-5 gap-3">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="h-12 bg-gray-200 rounded-[12px] animate-pulse"
                            />
                          ))}
                        </div>
                      ) : infillOptions.length > 0 ? (
                        <div className="grid grid-cols-5 gap-3">
                          {infillOptions.map((infill: { label: string; value: string }) => (
                            <button
                              key={infill.value}
                              type="button"
                              onClick={() =>
                                setValue('infill', infill.value, { shouldValidate: true })
                              }
                              className={`px-4 py-3 rounded-[12px] border text-sm font-medium transition-colors ${
                                formData.infill === infill.value
                                  ? 'border-[#1D0DF3] bg-[#1D0DF3] text-white'
                                  : 'border-[#EFEFEF] bg-white text-[#292929] hover:bg-[#F8F8F8]'
                              }`}
                              style={{ fontFamily: 'var(--font-geist-sans)' }}
                            >
                              {infill.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#7C7C7C]">No infill options available</p>
                      )}
                      {errors.infill && (
                        <p className="mt-1 text-xs text-red-600">{errors.infill.message}</p>
                      )}
                    </div>

                    <div>
                      <label
                        className="flex items-center text-sm font-medium text-[#292929] mb-2"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        Wall Count
                        <InfoTooltip content="Outer shell thickness. More walls = stronger and smoother but use more material. Recommended: 2-3 walls." />
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={maxWallCount}
                        step={1}
                        {...register('wallCount')}
                        onChange={(e) => handleWallCountChange(e.target.value)}
                        placeholder="2"
                        className="w-full px-4 py-3 rounded-[12px] border border-[#EFEFEF] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      />
                      {errors.wallCount && (
                        <p className="mt-1 text-xs text-red-600">{errors.wallCount.message}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Step 3: Special Request, Configuration Summary */}
                {currentStep === 3 && (
                  <>
                    <div>
                      <label
                        className="flex items-center text-sm font-medium text-[#292929] mb-2"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        Special Request
                        <InfoTooltip content="Add special instructions, finishing requirements, or customization notes for your order." />
                      </label>
                      <textarea
                        {...register('specialRequest')}
                        placeholder="Any special requests or notes..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-[12px] border border-[#EFEFEF] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent resize-none"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      />
                      {errors.specialRequest && (
                        <p className="mt-1 text-xs text-red-600">{errors.specialRequest.message}</p>
                      )}
                    </div>

                    <div className="rounded-[12px] border border-[#EFEFEF] bg-[#F8F8F8] p-4">
                      <h3
                        className="text-sm font-medium text-[#292929] mb-2"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        Configuration Summary
                      </h3>
                      <ul
                        className="text-xs text-[#7C7C7C] space-y-1"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        <li>Material: {formData.material || '-'}</li>
                        <li>Color: {formData.color || '-'}</li>
                        <li>Layer Height: {formData.layerHeight || '-'}</li>
                        <li>Infill: {formData.infill || '-'}</li>
                        <li>Wall Count: {formData.wallCount || '-'}</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
        <div className="flex justify-between items-center p-6 border-t border-[#EFEFEF] flex-shrink-0 bg-white rounded-b-[20px]">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleBack}
                className="h-11 px-6 rounded-[12px] text-sm flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="h-11 px-6 rounded-[12px] text-sm"
            >
              Cancel
            </Button>
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleNext(e)
                }}
                className="h-11 px-6 gap-2 rounded-[12px] border border-[#1D0DF3] !bg-[#1D0DF3] text-white hover:!bg-[#1a0bd4] text-sm font-medium flex items-center"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                form="configure-form"
                disabled={!isValid}
                className="h-11 px-6 gap-2 rounded-[12px] border border-[#1D0DF3] !bg-[#1D0DF3] text-white hover:!bg-[#1a0bd4] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:!bg-[#1D0DF3]"
              >
                Save Configuration
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

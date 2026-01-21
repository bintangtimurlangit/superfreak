'use client'

import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { UploadedFile } from './UploadStep'
import { modelConfigurationSchema, type ModelConfigurationFormData } from '@/lib/validations/order'

interface ConfigureModalProps {
  isOpen: boolean
  onClose: () => void
  file: UploadedFile | null
  onSave: (fileId: string, configuration: ModelConfigurationFormData) => void
}

const lineHeightOptions = ['0.12', '0.16', '0.20', '0.24']
const infillOptions = ['20%', '40%', '60%', '80%', '95%']
const materialOptions = ['PLA', 'PETG', 'ABS', 'Resin', 'Other']
const colorOptions = ['Black', 'White', 'Grey', 'Transparent', 'Custom']

export default function ConfigureModal({ isOpen, onClose, file, onSave }: ConfigureModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<ModelConfigurationFormData>({
    resolver: zodResolver(modelConfigurationSchema),
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
  }, [file, isOpen, reset])

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
        <div className="flex items-center justify-between p-6 border-b border-[#EFEFEF]">
          <h2
            className="text-[24px] font-semibold text-[#292929]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Configure Model
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F8F8F8] rounded-[8px] transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-[#292929]" />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex gap-8 h-full items-start">
            <div className="hidden md:flex w-[480px] h-[480px] rounded-[16px] border border-dashed border-[#DCDCDC] bg-[#F8F8F8] flex-shrink-0 items-center justify-center sticky top-0">
              <span
                className="text-xs text-[#7C7C7C] text-center leading-tight"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                3D Preview
                <br />
                (Coming Soon)
              </span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
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

              <div className="space-y-6">
                <div>
                  <label
                    className="block text-sm font-medium text-[#292929] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Material <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {materialOptions.map((option) => (
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
                  {errors.material && (
                    <p className="mt-1 text-xs text-red-600">{errors.material.message}</p>
                  )}
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-[#292929] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Color <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {colorOptions.map((option) => (
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
                  {errors.color && (
                    <p className="mt-1 text-xs text-red-600">{errors.color.message}</p>
                  )}
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-[#292929] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Layer Height <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {lineHeightOptions.map((height) => (
                      <button
                        key={height}
                        type="button"
                        onClick={() => setValue('layerHeight', height, { shouldValidate: true })}
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
                  {errors.layerHeight && (
                    <p className="mt-1 text-xs text-red-600">{errors.layerHeight.message}</p>
                  )}
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-[#292929] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Infill <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {infillOptions.map((infill) => (
                      <button
                        key={infill}
                        type="button"
                        onClick={() => setValue('infill', infill, { shouldValidate: true })}
                        className={`px-4 py-3 rounded-[12px] border text-sm font-medium transition-colors ${
                          formData.infill === infill
                            ? 'border-[#1D0DF3] bg-[#1D0DF3] text-white'
                            : 'border-[#EFEFEF] bg-white text-[#292929] hover:bg-[#F8F8F8]'
                        }`}
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        {infill}
                      </button>
                    ))}
                  </div>
                  {errors.infill && (
                    <p className="mt-1 text-xs text-red-600">{errors.infill.message}</p>
                  )}
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-[#292929] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Wall Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
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

                <div>
                  <label
                    className="block text-sm font-medium text-[#292929] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Special Request
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
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-[#EFEFEF]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="h-11 px-6 rounded-[12px] text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isValid}
                  className="h-11 px-6 gap-2 rounded-[12px] border border-[#1D0DF3] !bg-[#1D0DF3] text-white hover:!bg-[#1a0bd4] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:!bg-[#1D0DF3]"
                >
                  Save Configuration
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

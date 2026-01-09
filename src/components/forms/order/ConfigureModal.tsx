'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { UploadedFile, ModelConfiguration } from './UploadStep'

interface ConfigureModalProps {
  isOpen: boolean
  onClose: () => void
  file: UploadedFile | null
  onSave: (fileId: string, configuration: ModelConfiguration) => void
}

const lineHeightOptions = ['0.12', '0.16', '0.20', '0.24']
const infillOptions = ['20%', '40%', '60%', '80%', '95%']
const materialOptions = ['PLA', 'PETG', 'ABS', 'Resin', 'Other']
const colorOptions = ['Black', 'White', 'Grey', 'Transparent', 'Custom']

export default function ConfigureModal({ isOpen, onClose, file, onSave }: ConfigureModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ModelConfiguration>({
    material: '',
    layerHeight: '',
    color: '',
    infill: '',
    wallCount: '2',
    specialRequest: '',
  })

  useEffect(() => {
    if (file?.configuration) {
      setFormData({
        material: file.configuration.material || '',
        layerHeight: file.configuration.layerHeight || '',
        color: file.configuration.color || '',
        infill: file.configuration.infill || '',
        wallCount: file.configuration.wallCount || '2',
        specialRequest: file.configuration.specialRequest || '',
      })
    } else {
      setFormData({
        material: '',
        layerHeight: '',
        color: '',
        infill: '',
        wallCount: '2',
        specialRequest: '',
      })
    }
    setCurrentStep(1)
  }, [file, isOpen])

  if (!isOpen || !file) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(file.id, formData)
    onClose()
  }

  const handleChange = (field: keyof ModelConfiguration, value: string) => {
    if (field === 'wallCount') {
      const num = Number(value)
      if (Number.isNaN(num)) {
        setFormData((prev) => ({ ...prev, wallCount: '' }))
        return
      }
      const clamped = Math.max(1, Math.min(10, Math.round(num)))
      setFormData((prev) => ({ ...prev, wallCount: String(clamped) }))
      return
    }

    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const totalSteps = 3
  const step1Valid = !!(formData.material && formData.color)
  const step2Valid = !!(formData.layerHeight && formData.infill)
  const allRequiredSet =
    !!formData.material && !!formData.color && !!formData.layerHeight && !!formData.infill

  const goNext = () => {
    if (currentStep === 1 && !step1Valid) return
    if (currentStep === 2 && !step2Valid) return
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-[20px] border border-[#EFEFEF] w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
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

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto min-h-[520px]">
          <div className="flex gap-8 h-full items-center">
            {/* Large 3D Preview placeholder - left column (big fixed 1:1 square) */}
            <div className="hidden md:flex w-[480px] h-[480px] rounded-[16px] border border-dashed border-[#DCDCDC] bg-[#F8F8F8] flex-shrink-0 items-center justify-center">
              <span
                className="text-xs text-[#7C7C7C] text-center leading-tight"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                3D Preview
                <br />
                (Coming Soon)
              </span>
            </div>

            {/* Right column - form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
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

              <div className="space-y-6 min-h-[320px]">
                {currentStep === 1 && (
                  <>
                    {/* Material */}
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
                            onClick={() => handleChange('material', option)}
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
                    </div>

                    {/* Color */}
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
                            onClick={() => handleChange('color', option)}
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
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    {/* Line Height */}
                    <div>
                      <label
                        className="block text-sm font-medium text-[#292929] mb-2"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        Line Height <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-4 gap-3">
                        {lineHeightOptions.map((height) => (
                          <button
                            key={height}
                            type="button"
                            onClick={() => handleChange('layerHeight', height)}
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
                    </div>

                    {/* Infill */}
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
                            onClick={() => handleChange('infill', infill)}
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
                    </div>

                    {/* Wall Count */}
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
                        max={10}
                        step={1}
                        value={formData.wallCount || ''}
                        onChange={(e) => handleChange('wallCount', e.target.value)}
                        placeholder="2"
                        className="w-full px-4 py-3 rounded-[12px] border border-[#EFEFEF] text-sm placeholder:text-[#9CA3AF] placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      />
                    </div>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    {/* Special Request */}
                    <div>
                      <label
                        className="block text-sm font-medium text-[#292929] mb-2"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        Special Request
                      </label>
                      <textarea
                        value={formData.specialRequest || ''}
                        onChange={(e) => handleChange('specialRequest', e.target.value)}
                        placeholder="Any special requests or notes..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-[12px] border border-[#EFEFEF] text-sm placeholder:text-[#9CA3AF] placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent resize-none"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      />
                    </div>

                    {/* Quick summary */}
                    <div className="mt-4 rounded-[12px] border border-[#EFEFEF] bg-[#F8F8F8] p-4">
                      <h3
                        className="text-sm font-medium text-[#292929] mb-2"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        Summary
                      </h3>
                      <ul
                        className="text-xs text-[#7C7C7C] space-y-1"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        <li>Material: {formData.material || '-'}</li>
                        <li>Color: {formData.color || '-'}</li>
                        <li>Line Height: {formData.layerHeight || '-'}</li>
                        <li>Infill: {formData.infill || '-'}</li>
                        <li>Wall Count: {formData.wallCount || '-'}</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-[#EFEFEF]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={currentStep === 1 ? onClose : goBack}
                  className="h-11 px-6 rounded-[12px] text-sm"
                >
                  {currentStep === 1 ? 'Cancel' : 'Back'}
                </Button>
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={goNext}
                    disabled={currentStep === 1 ? !step1Valid : !step2Valid}
                    className="h-11 px-6 gap-2 rounded-[12px] border border-[#1D0DF3] !bg-[#1D0DF3] text-white hover:!bg-[#1a0bd4] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:!bg-[#1D0DF3]"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!allRequiredSet}
                    className="h-11 px-6 gap-2 rounded-[12px] border border-[#1D0DF3] !bg-[#1D0DF3] text-white hover:!bg-[#1a0bd4] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:!bg-[#1D0DF3]"
                  >
                    Save Configuration
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

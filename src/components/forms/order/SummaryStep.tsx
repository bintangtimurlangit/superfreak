'use client'

import { ChevronRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { UploadedFile } from './UploadStep'

interface SummaryStepProps {
  uploadedFiles: UploadedFile[]
  onBack: () => void
  onNext: () => void
}

export default function SummaryStep({ uploadedFiles, onBack, onNext }: SummaryStepProps) {
  return (
    <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 md:p-6">
      <div className="mb-6">
        <h2
          className="text-[24px] font-semibold text-[#292929] mb-2"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          Order Summary
        </h2>
        <p
          className="text-sm text-[#7C7C7C]"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          Review your order details before proceeding to payment.
        </p>
      </div>

      <div className="space-y-4 mb-6">
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
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className="text-base font-semibold text-[#292929]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Rp 0
                  </p>
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="border-t border-[#EFEFEF] pt-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span
            className="text-sm text-[#7C7C7C]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Subtotal
          </span>
          <span
            className="text-sm font-medium text-[#292929]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Rp 0
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
            Rp 0
          </span>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-[#EFEFEF]">
        <Button
          onClick={onBack}
          variant="secondary"
          className="h-11 px-6 rounded-[12px] text-sm"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          className="h-11 px-6 gap-2 rounded-[12px] border border-[#1D0DF3] !bg-[#1D0DF3] text-white hover:!bg-[#1a0bd4] text-sm font-medium"
        >
          Proceed to Payment
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

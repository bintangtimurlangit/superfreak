'use client'

import { ChevronRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { UploadedFile } from './UploadStep'

interface PaymentStepProps {
  onBack: () => void
  uploadedFiles: UploadedFile[]
  // When order is created, call finalizeFiles with orderId and tempFileIds
  // Example: await fetch('/api/files/finalize', { method: 'POST', body: JSON.stringify({ orderId, tempFileIds }) })
}

export default function PaymentStep({ onBack }: PaymentStepProps) {
  return (
    <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 md:p-6">
      <div className="mb-6">
        <h2
          className="text-[24px] font-semibold text-[#292929] mb-2"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          Payment
        </h2>
        <p
          className="text-sm text-[#7C7C7C]"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          Complete your order by selecting a payment method.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="border border-[#EFEFEF] rounded-[12px] p-4 bg-[#F8F8F8]">
          <p
            className="text-sm text-[#7C7C7C]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Payment methods will be available here.
          </p>
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
        <Button className="h-11 px-6 gap-2 rounded-[12px] border border-[#1D0DF3] !bg-[#1D0DF3] text-white hover:!bg-[#1a0bd4] text-sm font-medium">
          Complete Order
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

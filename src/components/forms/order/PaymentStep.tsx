'use client'

import { useState } from 'react'
import {
  ChevronRight,
  Loader2,
  CreditCard,
  Smartphone,
  Building2,
  type LucideIcon,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import type { UploadedFile } from './UploadStep'
import Script from 'next/script'

interface PaymentStepProps {
  onBack: () => void
  uploadedFiles: UploadedFile[]
  orderId?: string
}

type PaymentMethod = 'bank_transfer' | 'credit_card' | 'e_wallet' | 'qris'

interface PaymentMethodOption {
  id: PaymentMethod
  title: string
  description: string
  icon: LucideIcon
}

const paymentMethods: PaymentMethodOption[] = [
  {
    id: 'bank_transfer',
    title: 'Bank Transfer',
    description: 'BCA, Mandiri, BNI, BRI, & others',
    icon: Building2,
  },
  {
    id: 'credit_card',
    title: 'Credit Card',
    description: 'Visa, Mastercard, & JCB',
    icon: CreditCard,
  },
  {
    id: 'e_wallet',
    title: 'QRIS & E-Wallet',
    description: 'GoPay, ShopeePay, QRIS, & others',
    icon: Smartphone,
  },
]

export default function PaymentStep({ onBack, orderId }: PaymentStepProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async () => {
    if (!orderId) {
      setError('Order ID not found. Please try again.')
      return
    }

    if (!selectedMethod) {
      setError('Please select a payment method.')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // 1. Initialize payment with the selected method
      const response = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId,
          paymentMethod: selectedMethod,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to initialize payment')
      }

      const { snapToken } = await response.json()

      // 2. Open Midtrans Snap payment popup
      if (window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: function (result: unknown) {
            console.log('Payment success:', result)
            window.location.href = `/orders/${orderId}?payment=success`
          },
          onPending: function (result: unknown) {
            console.log('Payment pending:', result)
            window.location.href = `/orders/${orderId}?payment=pending`
          },
          onError: function (result: unknown) {
            console.error('Payment error:', result)
            setError('Payment failed. Please try again.')
            setIsProcessing(false)
          },
          onClose: function () {
            console.log('Payment popup closed')
            setIsProcessing(false)
          },
        })
      } else {
        throw new Error('Midtrans Snap is not loaded')
      }
    } catch (err) {
      console.error('Error in payment flow:', err)
      setError(err instanceof Error ? err.message : 'Failed to process payment')
      setIsProcessing(false)
    }
  }

  return (
    <>
      <Script
        src={`https://app.${process.env.NODE_ENV === 'production' ? '' : 'sandbox.'}midtrans.com/snap/snap.js`}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />

      <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 md:p-6">
        <div className="mb-6">
          <h2
            className="text-[24px] font-semibold text-[#292929] mb-2"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Payment Method
          </h2>
          <p className="text-sm text-[#7C7C7C]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
            Choose your preferred way to pay.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[12px]">
            <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-geist-sans)' }}>
              {error}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {paymentMethods.map((method) => {
            const Icon = method.icon
            const isSelected = selectedMethod === method.id

            return (
              <button
                key={method.id}
                onClick={() => {
                  setSelectedMethod(method.id)
                  setError(null)
                }}
                className={`flex items-center gap-4 p-4 rounded-[16px] border transition-all text-left ${
                  isSelected
                    ? 'border-[#1D0DF3] bg-[#1D0DF3]/5 ring-1 ring-[#1D0DF3]'
                    : 'border-[#EFEFEF] hover:border-[#DCDCDC] bg-white'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-[#1D0DF3] text-white' : 'bg-[#F8F8F8] text-[#7C7C7C]'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3
                    className="text-[15px] font-semibold text-[#292929]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    {method.title}
                  </h3>
                  <p
                    className="text-xs text-[#7C7C7C]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    {method.description}
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected ? 'border-[#1D0DF3] bg-[#1D0DF3]' : 'border-[#DCDCDC]'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex justify-between pt-6 border-t border-[#EFEFEF]">
          <Button
            onClick={onBack}
            variant="secondary"
            className="h-11 px-6 rounded-[12px] text-sm font-medium"
            disabled={isProcessing}
          >
            Back
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isProcessing || !selectedMethod}
            className={`h-11 px-6 gap-2 rounded-[12px] border text-sm font-medium transition-all ${
              !selectedMethod
                ? 'bg-[#F1F1F1] border-[#EFEFEF] text-[#7C7C7C] cursor-not-allowed'
                : 'border-[#1D0DF3] !bg-[#1D0DF3] text-white hover:!bg-[#1a0bd4]'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Proceed to Payment
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  )
}

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: any) => void
          onPending?: (result: any) => void
          onError?: (result: any) => void
          onClose?: () => void
        },
      ) => void
    }
  }
}

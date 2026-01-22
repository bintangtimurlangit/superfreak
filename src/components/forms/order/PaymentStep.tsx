'use client'

import { useState } from 'react'
import { ChevronRight, Loader2, CreditCard } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { UploadedFile } from './UploadStep'
import Script from 'next/script'

interface PaymentStepProps {
  onBack: () => void
  uploadedFiles: UploadedFile[]
  snapToken?: string // Snap token generated when order was created
  orderId?: string // Order ID from created order
}

export default function PaymentStep({ onBack, snapToken, orderId }: PaymentStepProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async () => {
    if (!snapToken) {
      setError('Payment token not available. Please go back and try again.')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Open Midtrans Snap payment popup
      if (window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: function (result: any) {
            console.log('Payment success:', result)
            // Redirect to order success page
            window.location.href = `/orders/${orderId}?payment=success`
          },
          onPending: function (result: any) {
            console.log('Payment pending:', result)
            // Redirect to order pending page
            window.location.href = `/orders/${orderId}?payment=pending`
          },
          onError: function (result: any) {
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
      console.error('Error opening payment:', err)
      setError(err instanceof Error ? err.message : 'Failed to open payment')
      setIsProcessing(false)
    }
  }

  return (
    <>
      {/* Load Midtrans Snap script */}
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
            Payment
          </h2>
          <p className="text-sm text-[#7C7C7C]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
            Complete your order by proceeding to payment.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[12px]">
            <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-geist-sans)' }}>
              {error}
            </p>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="border border-[#EFEFEF] rounded-[12px] p-6 bg-[#F8F8F8]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#1D0DF3]/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-[#1D0DF3]" />
              </div>
              <div>
                <h3
                  className="text-base font-medium text-[#292929]"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Midtrans Payment Gateway
                </h3>
                <p
                  className="text-sm text-[#7C7C7C]"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Secure payment powered by Midtrans
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p
                className="text-xs text-[#7C7C7C]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Supported payment methods:
              </p>
              <div className="flex flex-wrap gap-2">
                {['Credit Card', 'Bank Transfer', 'E-Wallet', 'QRIS'].map((method) => (
                  <span
                    key={method}
                    className="px-3 py-1 bg-white border border-[#DCDCDC] rounded-full text-xs text-[#292929]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-6 border-t border-[#EFEFEF]">
          <Button
            onClick={onBack}
            variant="secondary"
            className="h-11 px-6 rounded-[12px] text-sm"
            disabled={isProcessing}
          >
            Back
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="h-11 px-6 gap-2 rounded-[12px] border border-[#1D0DF3] !bg-[#1D0DF3] text-white hover:!bg-[#1a0bd4] text-sm font-medium"
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

// Declare Midtrans Snap types
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

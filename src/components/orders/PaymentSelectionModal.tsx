'use client'

import { useState } from 'react'
import { CreditCard, Smartphone, Building2, X, Loader2, type LucideIcon } from 'lucide-react'
import Button from '@/components/ui/Button'
import Script from 'next/script'

interface PaymentSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber: string
  totalAmount: number
}

type PaymentMethod = 'bank_transfer' | 'credit_card' | 'e_wallet'

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

export default function PaymentSelectionModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  totalAmount,
}: PaymentSelectionModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Please select a payment method.')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <Script
        src={`https://app.${process.env.NODE_ENV === 'production' ? '' : 'sandbox.'}midtrans.com/snap/snap.js`}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EFEFEF] flex items-center justify-between bg-gray-50/50">
          <div>
            <h2
              className="text-lg font-bold text-[#292929]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Complete Your Payment
            </h2>
            <p className="text-xs text-[#7C7C7C]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
              Order: {orderNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-[#292929]" />
          </button>
        </div>

        <div className="p-6">
          {/* Order Brief */}
          <div className="mb-6 p-4 bg-[#F8F8F8] rounded-xl border border-[#EFEFEF] flex items-center justify-between">
            <span
              className="text-sm text-[#7C7C7C]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Amount to Pay
            </span>
            <span
              className="text-xl font-bold text-[#1D0DF3]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              {formatCurrency(totalAmount)}
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              const isSelected = selectedMethod === method.id

              return (
                <button
                  key={method.id}
                  disabled={isProcessing}
                  onClick={() => {
                    setSelectedMethod(method.id)
                    setError(null)
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group ${
                    isSelected
                      ? 'border-[#1D0DF3] bg-[#1D0DF3]/5 ring-1 ring-[#1D0DF3]'
                      : 'border-[#EFEFEF] hover:border-[#DCDCDC] bg-white'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-[#1D0DF3] text-white'
                        : 'bg-gray-100 text-[#7C7C7C] group-hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3
                      className="text-sm font-semibold text-[#292929]"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      {method.title}
                    </h3>
                    <p
                      className="text-[11px] text-[#7C7C7C]"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      {method.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-[#EFEFEF] flex gap-3">
          <Button
            variant="secondary"
            className="flex-1 border-[#DCDCDC]"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-[#1D0DF3] text-white hover:bg-[#1a0cd9]"
            disabled={!selectedMethod || isProcessing}
            onClick={handlePayment}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Pay Now'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { X, Mail } from 'lucide-react'
import { sendVerificationEmail } from '@/lib/auth/client'

interface EmailConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  email?: string
  onVerificationSuccess?: (email: string) => void
}

export default function EmailConfirmationModal({
  isOpen,
  onClose,
  email,
  onVerificationSuccess: _onVerificationSuccess,
}: EmailConfirmationModalProps) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const handleResendVerification = async () => {
    if (!email) {
      setError('Email address is required')
      return
    }

    setError('')
    setResending(true)

    try {
      // Use better-auth's sendVerificationEmail
      await sendVerificationEmail({
        email,
        fetchOptions: {
          onSuccess: () => {
            setError('')
            setLoading(true) // Show success state
            setTimeout(() => setLoading(false), 3000)
          },
          onError: (error: { error?: { message?: string } }) => {
            const errorMessage = error.error?.message || 'Failed to resend verification email. Please try again.'
            setError(errorMessage)
          },
        },
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification email. Please try again.'
      setError(errorMessage)
    } finally {
      setResending(false)
    }
  }

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleEscapeKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={handleOverlayClick}
      onKeyDown={handleEscapeKey}
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-confirmation-title"
    >
      <div className="relative w-full max-w-[400px] rounded-[20px] border border-[#DCDCDC] p-[2px] bg-[#F8F8F8] max-h-[90vh] overflow-y-auto">
        <div className="relative w-full bg-white rounded-[18px] shadow-xl">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 text-[#6b7280] hover:text-[#292929] transition-colors z-10"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="p-3">
            {/* Logo */}
            <div className="flex flex-col items-center mb-5">
              <div className="leading-none select-none">
                <Image src="/logo.png" alt="Superfreak Studio" width={130} height={43} />
              </div>
            </div>

            {/* Inner Container Box */}
            <div className="border border-[#DCDCDC] rounded-[12px] p-5">
              {/* Title */}
              <h2
                id="email-confirmation-title"
                className="text-lg font-semibold text-[#292929] mb-1.5 text-left"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Check Your Email
              </h2>
              <p
                className="text-xs text-[#6b7280] mb-5 text-left"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                {email
                  ? `We've sent a verification link to ${email}. Please click the link in the email to verify your account.`
                  : "We've sent a verification link to your email. Please click the link in the email to verify your account."}
              </p>

              {/* Error Message */}
              {error && (
                <div className="mb-3 p-2.5 rounded-[12px] bg-red-50 border border-red-200">
                  <p className="text-xs text-red-600" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                    {error}
                  </p>
                </div>
              )}

              {/* Success Message (after resending) */}
              {!error && resending === false && loading && (
                <div className="mb-3 p-2.5 rounded-[12px] bg-green-50 border border-green-200">
                  <p className="text-xs text-green-600" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                    Verification email sent! Please check your inbox.
                  </p>
                </div>
              )}

              {/* Email Icon */}
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-[#F8F8F8] border-2 border-[#EFEFEF] flex items-center justify-center">
                  <Mail className="w-10 h-10 text-[#1D0DF3]" />
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3 mb-6">
                <div className="text-sm text-[#292929] text-left" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                  <p className="mb-2 font-medium">Next steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-[#6b7280]">
                    <li>Check your email inbox (and spam folder)</li>
                    <li>Click the verification link in the email</li>
                    <li>You&apos;ll be automatically signed in</li>
                  </ol>
                </div>
              </div>

              {/* Resend Email Section */}
              <div className="text-center pt-3 border-t border-[#EFEFEF]">
                <p
                  className="text-xs text-[#6b7280] mb-3"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Didn&apos;t receive the email?
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleResendVerification}
                  disabled={resending || !email}
                  className="w-full h-10 rounded-[10px] border border-[#DCDCDC] bg-white text-[#292929] hover:bg-[#F8F8F8] font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

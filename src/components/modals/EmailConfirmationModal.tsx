'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { X } from 'lucide-react'

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
  onVerificationSuccess,
}: EmailConfirmationModalProps) {
  const [code, setCode] = useState(['', '', '', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0]?.focus()
    }
  }, [isOpen])

  const handleInputChange = (index: number, value: string) => {
    // Only allow alphanumeric characters
    const sanitizedValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 1)

    if (sanitizedValue) {
      const newCode = [...code]
      newCode[index] = sanitizedValue
      setCode(newCode)
      setError('')

      // Auto-focus next input
      if (index < 7 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus()
      }
    } else {
      // Clear current input
      const newCode = [...code]
      newCode[index] = ''
      setCode(newCode)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 7) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8)
    const newCode = [...code]

    for (let i = 0; i < 8; i++) {
      newCode[i] = pastedData[i] || ''
    }

    setCode(newCode)
    setError('')

    // Focus the next empty input or the last one
    const nextEmptyIndex = newCode.findIndex((char) => !char)
    const focusIndex = nextEmptyIndex === -1 ? 7 : nextEmptyIndex
    inputRefs.current[focusIndex]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const confirmationCode = code.join('')

    if (confirmationCode.length !== 8) {
      setError('Please enter the complete 8-character code')
      return
    }

    if (!email) {
      setError('Email address is required')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/app-users/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: confirmationCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed')
      }

      setError('')
      setLoading(false)
      setSuccess(true)
      
      setTimeout(() => {
        onClose()
        if (onVerificationSuccess && email) {
          onVerificationSuccess(email)
        } else {
          window.location.reload()
        }
      }, 1500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify email. Please try again.'
      setError(errorMessage)
      setLoading(false)
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
                Verify Your Email
              </h2>
              <p
                className="text-xs text-[#6b7280] mb-5 text-left"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                {email
                  ? `We've sent a verification code to ${email}. Please enter it below.`
                  : "We've sent a verification code to your email. Please enter it below."}
              </p>

              {/* Success Message */}
              {success && (
                <div className="mb-3 p-2.5 rounded-[12px] bg-green-50 border border-green-200">
                  <p className="text-xs text-green-600" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                    Email verified successfully! Please sign in to continue.
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && !success && (
                <div className="mb-3 p-2.5 rounded-[12px] bg-red-50 border border-red-200">
                  <p className="text-xs text-red-600" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                    {error}
                  </p>
                </div>
              )}

              {/* Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Code Input Fields */}
                <div>
                  <label
                    htmlFor="confirmation-code"
                    className="block text-xs font-medium text-[#292929] mb-3 text-left"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Enter verification code
                  </label>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {code.map((char, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el
                        }}
                        type="text"
                        inputMode="text"
                        maxLength={1}
                        value={char}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        className="w-10 h-10 sm:w-12 sm:h-12 text-center text-base sm:text-lg font-semibold rounded-[10px] border border-[#DCDCDC] bg-[#F8F8F8] text-[#292929] focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent transition-all uppercase"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                        aria-label={`Code character ${index + 1}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-center mt-3">
                    <div className="flex gap-1">
                      {code.map((_, index) => (
                        <div
                          key={index}
                          className={`h-1 w-8 rounded-full transition-colors ${
                            code[index] ? 'bg-blue-700' : 'bg-[#DCDCDC]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Verify Button */}
                <Button
                  type="submit"
                  disabled={loading || success || code.join('').length !== 8}
                  className="w-full h-10 rounded-[10px] bg-blue-700 text-white hover:bg-blue-800 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  {loading ? 'Verifying...' : success ? 'Verified!' : 'Verify Email'}
                </Button>

                {/* Resend Code Section */}
                <div className="text-center pt-3">
                  <p
                    className="text-xs text-[#6b7280] mb-3"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Didn&apos;t receive the code?
                  </p>
                  <button
                    type="button"
                    className="text-xs text-blue-700 hover:text-blue-800 underline underline-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                    disabled={loading || !email}
                    onClick={async () => {
                      if (!email) {
                        setError('Email address is required')
                        return
                      }

                      setError('')
                      setLoading(true)

                      try {
                        const response = await fetch('/api/app-users/resend-verification', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ email }),
                        })

                        const data = await response.json()

                        if (!response.ok) {
                          throw new Error(data.message || 'Failed to resend code')
                        }

                        setCode(['', '', '', '', '', '', '', ''])
                        setError('')
                        inputRefs.current[0]?.focus()
                      } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Failed to resend code. Please try again.'
                        setError(errorMessage)
                      } finally {
                        setLoading(false)
                      }
                    }}
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

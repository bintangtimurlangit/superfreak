'use client'

import { useState } from 'react'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { X } from 'lucide-react'

interface ResetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToSignIn?: () => void
}

export default function ResetPasswordModal({ isOpen, onClose, onSwitchToSignIn }: ResetPasswordModalProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!email.trim()) {
      setError('Email is required')
      setLoading(false)
      return
    }

    // TODO: Implement reset password logic
    // For now, just simulate success
    setTimeout(() => {
      setSuccess(true)
      setLoading(false)
    }, 1000)
  }

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-title"
    >
      <div className="relative w-full max-w-[400px] rounded-[20px] border border-[#DCDCDC] p-[2px] bg-[#F8F8F8]">
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
                id="reset-password-title"
                className="text-lg font-semibold text-[#292929] mb-1.5 text-left"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Reset Password
              </h2>
              <p
                className="text-xs text-[#6b7280] mb-5 text-left"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              {/* Success Message */}
              {success && (
                <div className="mb-3 p-2.5 rounded-[12px] bg-green-50 border border-green-200">
                  <p className="text-xs text-green-600" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                    Password reset link has been sent to your email. Please check your inbox.
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
              {!success && (
                <form className="space-y-4" onSubmit={handleResetPassword}>
                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="reset-email"
                      className="block text-xs font-medium text-[#292929] mb-1.5"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      Email
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-3 py-2 rounded-[10px] border border-[#DCDCDC] bg-[#F8F8F8] text-[#292929] text-sm placeholder:text-[#9CA3AF] placeholder:text-s focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent transition-all"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                      required
                    />
                  </div>

                  {/* Reset Password Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 rounded-[10px] bg-blue-700 text-white hover:bg-blue-800 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>

                  {/* Back to Sign In Section */}
                  <div className="text-center pt-3">
                    <p
                      className="text-xs text-[#6b7280] mb-3"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      Remember your password?
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full h-10 rounded-[10px] border border-[#DCDCDC] bg-white text-blue-700 hover:bg-[#F8F8F8] hover:text-blue-800 font-medium text-sm"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                      onClick={() => {
                        onClose()
                        onSwitchToSignIn?.()
                      }}
                    >
                      Back to Sign In
                    </Button>
                  </div>
                </form>
              )}

              {/* Success State - Back to Sign In Button */}
              {success && (
                <div className="text-center pt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full h-10 rounded-[10px] border border-[#DCDCDC] bg-white text-blue-700 hover:bg-[#F8F8F8] hover:text-blue-800 font-medium text-sm"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                    onClick={() => {
                      onClose()
                      onSwitchToSignIn?.()
                    }}
                  >
                    Back to Sign In
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

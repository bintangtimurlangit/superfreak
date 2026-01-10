'use client'

import { useState } from 'react'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { Eye, EyeOff, X } from 'lucide-react'

interface SetNewPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToSignIn?: () => void
}

export default function SetNewPasswordModal({
  isOpen,
  onClose,
  onSwitchToSignIn,
}: SetNewPasswordModalProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!password) {
      setError('Password is required')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // TODO: Implement password reset logic
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
      aria-labelledby="set-password-title"
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
                id="set-password-title"
                className="text-lg font-semibold text-[#292929] mb-1.5 text-left"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Set New Password
              </h2>
              <p
                className="text-xs text-[#6b7280] mb-5 text-left"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Enter your new password below.
              </p>

              {/* Success Message */}
              {success && (
                <div className="mb-3 p-2.5 rounded-[12px] bg-green-50 border border-green-200">
                  <p className="text-xs text-green-600" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                    Your password has been successfully reset. You can now sign in with your new password.
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
                <form className="space-y-4" onSubmit={handleSetPassword}>
                  {/* Password Field */}
                  <div>
                    <label
                      htmlFor="new-password"
                      className="block text-xs font-medium text-[#292929] mb-1.5"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your new password"
                        className="w-full px-3 py-2 pr-10 rounded-[10px] border border-[#DCDCDC] bg-[#F8F8F8] text-[#292929] text-sm placeholder:text-[#9CA3AF] placeholder:text-s focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent transition-all"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#292929] transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-[#6b7280] mt-0.5" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                      Must be at least 8 characters
                    </p>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label
                      htmlFor="confirm-new-password"
                      className="block text-xs font-medium text-[#292929] mb-1.5"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-new-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        className="w-full px-3 py-2 pr-10 rounded-[10px] border border-[#DCDCDC] bg-[#F8F8F8] text-[#292929] text-sm placeholder:text-[#9CA3AF] placeholder:text-s focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent transition-all"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#292929] transition-colors"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Set Password Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 rounded-[10px] bg-blue-700 text-white hover:bg-blue-800 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    {loading ? 'Setting Password...' : 'Set Password'}
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
                    Sign In
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

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { Eye, EyeOff, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { login as apiLogin } from '@/lib/auth/api-auth'

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToSignUp?: () => void
  onSwitchToResetPassword?: () => void
  initialEmail?: string
}

export default function SignInModal({
  isOpen,
  onClose,
  onSwitchToSignUp,
  onSwitchToResetPassword,
  initialEmail,
}: SignInModalProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState(initialEmail || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialEmail && isOpen) {
      setEmail(initialEmail)
    }
  }, [initialEmail, isOpen])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email.trim()) {
      setError('Email is required')
      setLoading(false)
      return
    }

    if (!password) {
      setError('Password is required')
      setLoading(false)
      return
    }

    try {
      await apiLogin(email.trim(), password)
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      onClose()
      router.refresh()
      router.push('/')
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
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
      aria-labelledby="signin-title"
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
                id="signin-title"
                className="text-lg font-semibold text-[#292929] mb-1.5 text-left"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Sign In
              </h2>
              <p
                className="text-xs text-[#6b7280] mb-5 text-left"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Enter your email and password to login to your account.
              </p>

              {/* Error Message */}
              {error && (
                <div className="mb-3 p-2.5 rounded-[12px] bg-red-50 border border-red-200">
                  <p className="text-xs text-red-600" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                    {error}
                  </p>
                </div>
              )}

              {/* Form */}
              <form className="space-y-4" onSubmit={handleSignIn}>
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium text-[#292929] mb-1.5"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 rounded-[10px] border border-[#DCDCDC] bg-[#F8F8F8] text-[#292929] text-sm placeholder:text-[#9CA3AF] placeholder:text-s focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent transition-all"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  />
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="block text-xs font-medium text-[#292929]"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        onSwitchToResetPassword?.()
                      }}
                      className="text-xs text-[#6b7280] hover:text-[#292929] underline underline-offset-2 transition-colors"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-3 py-2 pr-10 rounded-[10px] border border-[#DCDCDC] bg-[#F8F8F8] text-[#292929] text-sm placeholder:text-[#9CA3AF] placeholder:text-s focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent transition-all"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
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
                </div>

                {/* Sign In Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-[10px] bg-blue-700 text-white hover:bg-blue-800 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>

                {/* Sign Up Section */}
                <div className="text-center pt-3">
                  <p
                    className="text-xs text-[#6b7280] mb-3"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Don&apos;t have an account?
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full h-10 rounded-[10px] border border-[#DCDCDC] bg-white text-blue-700 hover:bg-[#F8F8F8] hover:text-blue-800 font-medium text-sm"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                    onClick={() => {
                      onClose()
                      onSwitchToSignUp?.()
                    }}
                  >
                    Sign Up
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

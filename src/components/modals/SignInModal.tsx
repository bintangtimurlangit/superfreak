'use client'

import { useState } from 'react'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { Eye, EyeOff, X } from 'lucide-react'
import { adminAuthClient } from '@/lib/auth'

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      const { oauth } = adminAuthClient.signin()
      await oauth('google')
    } catch (error) {
      console.error('Google sign-in error:', error)
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
      <div className="relative w-full max-w-[440px] rounded-[20px] border border-[#DCDCDC] p-[2px] bg-[#F8F8F8]">
        <div className="relative w-full bg-white rounded-[18px] shadow-xl">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[#6b7280] hover:text-[#292929] transition-colors z-10"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="p-4">
            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <div className="leading-none select-none">
                <Image src="/logo.png" alt="Superfreak Studio" width={150} height={50} />
              </div>
            </div>

            {/* Inner Container Box */}
            <div className="border border-[#DCDCDC] rounded-[12px] p-6">
              {/* Title */}
              <h2
                id="signin-title"
                className="text-[20px] font-semibold text-[#292929] mb-2 text-left"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Sign In
              </h2>
              <p
                className="text-sm text-[#6b7280] mb-6 text-left"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Enter your email and password to login to your account.
              </p>

              {/* Form */}
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[#292929] mb-2"
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
                    className="w-full px-3 py-2.5 rounded-[12px] border border-[#DCDCDC] bg-[#F8F8F8] text-[#292929] text-sm placeholder:text-[#9CA3AF] placeholder:text-s focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent transition-all"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  />
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-[#292929]"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {}}
                      className="text-sm text-[#6b7280] hover:text-[#292929] underline underline-offset-2 transition-colors"
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
                      className="w-full px-3 py-2.5 pr-10 rounded-[12px] border border-[#DCDCDC] bg-[#F8F8F8] text-[#292929] text-sm placeholder:text-[#9CA3AF] placeholder:text-s focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent transition-all"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#292929] transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <Button
                  type="submit"
                  className="w-full h-12 rounded-[12px] bg-blue-700 text-white hover:bg-blue-800 font-medium text-base"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Sign In
                </Button>

                {/* Google Button */}
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full h-12 rounded-[12px] border border-[#DCDCDC] bg-white text-[#292929] hover:bg-[#F8F8F8] font-medium text-base flex items-center justify-center gap-3 -mt-2"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                  onClick={handleGoogleSignIn}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue With Google
                </Button>

                {/* Sign Up Section */}
                <div className="text-center pt-4">
                  <p
                    className="text-sm text-[#6b7280] mb-4"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Don&apos;t have an account?
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full h-12 rounded-[12px] border border-[#DCDCDC] bg-white text-blue-700 hover:bg-[#F8F8F8] hover:text-blue-800 font-medium text-base"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
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

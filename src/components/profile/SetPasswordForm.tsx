'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock } from 'lucide-react'
import { api } from '@/lib/api-client'
import { AUTH } from '@/lib/api/urls'
import { setPasswordSchema, type SetPasswordFormData } from '@/lib/validations/password'
import { useQueryClient } from '@tanstack/react-query'

export default function SetPasswordForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: SetPasswordFormData) => {
    setError(null)
    setSuccess(false)

    try {
      const res = await api.post(AUTH.setPassword, {
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string }
        setError(err.message || 'Failed to set password')
        return
      }
      setSuccess(true)
      reset()
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      console.error('Set password error:', err)
      setError('An unexpected error occurred')
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 md:p-5 font-sans">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[#1D0DF3] rounded-[12px] flex items-center justify-center flex-shrink-0">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2
            className="text-[24px] sm:text-[28px] md:text-[32px] font-normal leading-[100%] tracking-[-0.5px] text-[#292929]"
          >
            Set Password
          </h2>
        </div>
        <p className="text-[14px] text-[#7C7C7C] mt-1">
          You signed in with Google. Set a password to also sign in with email and password.
        </p>
      </div>

      <div className="border-t border-[#EFEFEF] -mx-4 md:-mx-5 mb-6"></div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Password set successfully! You can now sign in with your email and password.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-[#292929] mb-2"
            >
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="newPassword"
              {...register('newPassword')}
              className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-[#F8F8F8] text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
              placeholder="Enter your new password (min. 8 characters)"
              disabled={isSubmitting}
            />
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
            )}
            {!errors.newPassword && (
              <p className="mt-1 text-xs text-[#989898]">
                Password must be at least 8 characters long
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-[#292929] mb-2"
            >
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              {...register('confirmPassword')}
              className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-[#F8F8F8] text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
              placeholder="Re-enter your password"
              disabled={isSubmitting}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#EFEFEF]">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-medium text-[#292929] border border-[#DCDCDC] rounded-lg hover:bg-[#F8F8F8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-medium text-white bg-[#1D0DF3] rounded-lg hover:bg-[#1a0bd9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Setting Password...' : 'Set Password'}
          </button>
        </div>
      </form>
    </div>
  )
}

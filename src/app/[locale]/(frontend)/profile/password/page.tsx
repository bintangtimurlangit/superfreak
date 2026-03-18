'use client'

import React from 'react'
import ProfileSidebar from '@/components/profile/ProfileSidebar'
import ChangePasswordForm from '@/components/profile/ChangePasswordForm'
import SetPasswordForm from '@/components/profile/SetPasswordForm'
import { useAuthSession } from '@/lib/auth/use-auth-session'

export default function ChangePasswordPage() {
  const { data: sessionData, isPending } = useAuthSession()
  const user = sessionData?.user ?? null
  const showSetPassword = user?.hasPassword === false

  return (
    <div className="min-h-screen bg-[#F8F8F8] font-sans">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <ProfileSidebar />
          <div className="flex-1">
            {!isPending && showSetPassword ? (
              <SetPasswordForm />
            ) : (
              <ChangePasswordForm />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


import React from 'react'
import ProfileSidebar from '@/components/profile/ProfileSidebar'
import ChangePasswordForm from '@/components/profile/ChangePasswordForm'

export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <ProfileSidebar />
          <div className="flex-1">
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </div>
  )
}

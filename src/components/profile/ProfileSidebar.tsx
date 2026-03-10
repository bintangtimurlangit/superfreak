'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useSignOut, useAuthSession } from '@/lib/auth/use-auth-session'
import Link from 'next/link'
import { ArrowLeft, Package, User, Home, Lock, LogOut } from 'lucide-react'
import ProfileAvatar from '@/components/profile/ProfileAvatar'

function ProfileSidebarSkeleton() {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-white border border-[#EFEFEF] rounded-[20px] p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-6" />
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#EFEFEF]">
            <div className="w-12 h-12 bg-gray-200 rounded-lg" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-40" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </aside>
  )
}

export default function ProfileSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const authSession = useAuthSession()
  const user = authSession.data?.user ?? null
  const isAuthenticated = !!user

  useEffect(() => {
    const handleSessionUpdate = () => {
      router.refresh()
    }
    window.addEventListener('session-updated', handleSessionUpdate)
    return () => window.removeEventListener('session-updated', handleSessionUpdate)
  }, [router])

  const displayName = user?.name || (user?.email ? String(user.email).split('@')[0] : 'User')
  const initials =
    (user?.name ? String(user.name)[0]?.toUpperCase() : '') ||
    (user?.email ? String(user.email)[0]?.toUpperCase() : '') ||
    'U'

  if (!isAuthenticated || !user) {
    return null
  }

  const signOutAuth = useSignOut()
  const handleLogout = async () => {
    try {
      await signOutAuth({ callbackURL: '/' })
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/')
    }
  }

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 font-sans">
      <div className="bg-white border border-[#EFEFEF] rounded-[20px] p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[14px] text-[#292929] hover:text-[#1D0DF3] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-medium">Back</span>
        </button>

        <div className="mb-6 pb-6 border-b border-[#EFEFEF]">
          <div className="flex items-center gap-3 mb-2">
            <ProfileAvatar
              hasImage={!!user?.image}
              displayName={displayName}
              initials={initials}
              size="md"
              className="rounded-lg"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] sm:text-[16px] font-semibold text-[#292929] truncate">
                {displayName}
              </h3>
              <p className="text-[12px] md:text-[14px] text-[#989898] truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          <div className="text-[12px] md:text-[14px] font-medium text-[#989898] uppercase tracking-wider mb-4">
            MY PROFILE
          </div>

          <Link
            href="/my-order"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === '/my-order'
                ? 'bg-[#1D0DF3] text-white'
                : 'text-[#292929] hover:bg-[#F8F8F8]'
            }`}
          >
            <Package className="h-5 w-5" />
            <span className="text-[14px] font-medium">My Orders</span>
          </Link>

          <Link
            href="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === '/profile'
                ? 'bg-[#1D0DF3] text-white'
                : 'text-[#292929] hover:bg-[#F8F8F8]'
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-[14px] font-medium">Edit Profile</span>
          </Link>

          <Link
            href="/profile/address"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === '/profile/addresses'
                ? 'bg-[#1D0DF3] text-white'
                : 'text-[#292929] hover:bg-[#F8F8F8]'
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-[14px] font-medium">Address Information</span>
          </Link>

          <Link
            href="/profile/password"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === '/profile/password'
                ? 'bg-[#1D0DF3] text-white'
                : 'text-[#292929] hover:bg-[#F8F8F8]'
            }`}
          >
            <Lock className="h-5 w-5" />
            <span className="text-[14px] font-medium">Change Password</span>
          </Link>
        </nav>

        <div className="mt-6 pt-6 border-t border-[#EFEFEF]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-[14px] font-medium">Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

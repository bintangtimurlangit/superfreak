'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useSession } from '@/hooks/useSession'
import Link from 'next/link'
import { ArrowLeft, Package, User, Home, Lock, LogOut } from 'lucide-react'
import { appAuthClient } from '@/lib/auth'
import Image from 'next/image'

function ProfileSidebarSkeleton() {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-white border border-[#EFEFEF] rounded-[20px] p-6">
        {/* Back Button Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* User Info Skeleton */}
        <div className="mb-6 pb-6 border-b border-[#EFEFEF]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-gray-200 animate-pulse flex-shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Navigation Skeleton */}
        <nav className="space-y-1">
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-3" />
          
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2 rounded-lg"
            >
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </nav>

        {/* Logout Skeleton */}
        <div className="mt-6 pt-6 border-t border-[#EFEFEF]">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </aside>
  )
}

export default function ProfileSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, displayName, initials, isSuccess: isAuthenticated, loading } = useSession()

  const handleLogout = async () => {
    try {
      await appAuthClient.signout({ returnTo: '/' })
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/'
    }
  }

  // Show skeleton while loading
  if (loading) {
    return <ProfileSidebarSkeleton />
  }

  // Don't show sidebar if not authenticated
  if (!isAuthenticated || !user) {
    return null
  }

  const profilePictureUrl = user.profilePicture
    ? typeof user.profilePicture === 'object'
      ? (user.profilePicture.url || user.profilePicture.thumbnailURL || user.profilePicture.sizes?.thumbnail?.url || null)
      : null
    : null

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-white border border-[#EFEFEF] rounded-[20px] p-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#292929] hover:text-[#1D0DF3] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* User Info */}
        <div className="mb-6 pb-6 border-b border-[#EFEFEF]">
          <div className="flex items-center gap-3 mb-2">
            {profilePictureUrl ? (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-blue-700 flex-shrink-0">
                <Image
                  src={profilePictureUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-blue-700 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">{initials}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#292929] truncate">
                {displayName}
              </div>
              <div className="text-xs text-[#989898] truncate">
                {user.email}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          <div className="text-xs font-semibold text-[#989898] uppercase tracking-wider mb-3">
            My Profile
          </div>
          
          <Link
            href="/order"
            className="flex items-center gap-3 px-3 py-2 text-sm text-[#292929] hover:bg-[#F8F8F8] rounded-lg transition-colors"
          >
            <Package className="h-4 w-4" />
            <span>My Orders</span>
            <span className="ml-auto text-xs text-[#989898]">10</span>
          </Link>

          <Link
            href="/profile"
            className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
              pathname === '/profile'
                ? 'text-white bg-[#1D0DF3]'
                : 'text-[#292929] hover:bg-[#F8F8F8]'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Edit Profile</span>
          </Link>

          <Link
            href="/profile/address"
            className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
              pathname === '/profile/address'
                ? 'text-white bg-[#1D0DF3]'
                : 'text-[#292929] hover:bg-[#F8F8F8]'
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Address Information</span>
          </Link>

          <Link
            href="/profile/password"
            className="flex items-center gap-3 px-3 py-2 text-sm text-[#292929] hover:bg-[#F8F8F8] rounded-lg transition-colors"
          >
            <Lock className="h-4 w-4" />
            <span>Change Password</span>
          </Link>
        </nav>

        {/* Logout */}
        <div className="mt-6 pt-6 border-t border-[#EFEFEF]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

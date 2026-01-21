'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { signOut } from '@/lib/auth/client'
import { useBetterAuth } from '@/lib/auth/context'
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, User, Home, Lock, LogOut } from 'lucide-react'
import Image from 'next/image'

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
  const { currentUserPromise } = useBetterAuth()
  const user = use(currentUserPromise)
  const isAuthenticated = !!user

  const appUser = user?.collection === 'app-users' ? user : null

  useEffect(() => {
    const handleSessionUpdate = () => {
      console.log('[ProfileSidebar] Session update event received, refreshing...')
      router.refresh()
    }

    window.addEventListener('session-updated', handleSessionUpdate)
    return () => window.removeEventListener('session-updated', handleSessionUpdate)
  }, [router])

  useEffect(() => {
    console.log('[ProfileSidebar] User updated:', {
      hasUser: !!user,
      userCollection: user?.collection,
      hasImage: !!appUser?.image,
      imageUrl: appUser?.image?.substring(0, 50),
    })
  }, [user, appUser])

  const displayName = appUser?.name || (user?.email ? String(user.email).split('@')[0] : 'User')
  const initials =
    (appUser?.name ? String(appUser.name)[0]?.toUpperCase() : '') ||
    (user?.email ? String(user.email)[0]?.toUpperCase() : '') ||
    'U'

  if (!isAuthenticated || !user) {
    return null
  }

  const profilePictureUrl = appUser?.image || null

  const handleLogout = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push('/')
            router.refresh()
          },
          onError: (error: any) => {
            console.error('Logout error:', error)
            router.push('/')
          },
        },
      })
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/')
    }
  }

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-white border border-[#EFEFEF] rounded-[20px] p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#292929] hover:text-[#1D0DF3] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="mb-6 pb-6 border-b border-[#EFEFEF]">
          <div className="flex items-center gap-3 mb-2">
            {profilePictureUrl ? (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-blue-700 flex-shrink-0">
                <Image src={profilePictureUrl} alt={displayName} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-blue-700 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-lg">{initials}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3
                className="text-base font-semibold text-[#292929] truncate"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                {displayName}
              </h3>
              <p
                className="text-sm text-[#989898] truncate"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          <div
            className="text-xs font-medium text-[#989898] uppercase tracking-wider mb-4"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            MY PROFILE
          </div>

          <Link
            href="/my-order"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === '/my-order'
                ? 'bg-[#1D0DF3] text-white'
                : 'text-[#292929] hover:bg-[#F8F8F8]'
            }`}
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            <Package className="h-5 w-5" />
            <span className="text-sm font-medium">My Orders</span>
          </Link>

          <Link
            href="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === '/profile'
                ? 'bg-[#1D0DF3] text-white'
                : 'text-[#292929] hover:bg-[#F8F8F8]'
            }`}
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            <User className="h-5 w-5" />
            <span className="text-sm font-medium">Edit Profile</span>
          </Link>

          <Link
            href="/profile/address"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === '/profile/addresses'
                ? 'bg-[#1D0DF3] text-white'
                : 'text-[#292929] hover:bg-[#F8F8F8]'
            }`}
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            <Home className="h-5 w-5" />
            <span className="text-sm font-medium">Address Information</span>
          </Link>

          <Link
            href="/profile/password"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === '/profile/password'
                ? 'bg-[#1D0DF3] text-white'
                : 'text-[#292929] hover:bg-[#F8F8F8]'
            }`}
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            <Lock className="h-5 w-5" />
            <span className="text-sm font-medium">Change Password</span>
          </Link>
        </nav>

        <div className="mt-6 pt-6 border-t border-[#EFEFEF]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

'use client'

import { useEffect, useState } from 'react'

/**
 * Current user's profile avatar.
 *
 * - If user.image is an absolute URL (e.g. Google avatar), we use it directly.
 * - Otherwise we use /api/users/me/profile-image (R2) so the browser sends the auth cookie.
 * - On load error (404, CORS, etc.) we fall back to initials like Google does.
 *
 * We use a plain <img> (not next/image) to avoid optimizer fetching without user cookies.
 */
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
const PROFILE_IMAGE_URL = API_ORIGIN
  ? `${API_ORIGIN}/api/users/me/profile-image`
  : '/api/users/me/profile-image'

function isAbsoluteImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
}

const sizeClasses = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-24 w-24',
} as const

const initialsSizeClasses = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
} as const

export type ProfileAvatarSize = keyof typeof sizeClasses

export interface ProfileAvatarProps {
  /** Whether the user has a profile image (backend has image URL). */
  hasImage: boolean
  /**
   * Cache-busting key. Pass the user's `image` URL (or any changing token) so
   * the browser fetches a fresh image when it changes.
   */
  cacheKey?: string | null
  displayName: string
  initials: string
  size?: ProfileAvatarSize
  /** Wrapper div class (e.g. rounded-full, rounded-lg, flex-shrink-0). */
  className?: string
  /** Class for the image when shown (e.g. object-cover). */
  imageClassName?: string
  /** Override image src (e.g. blob URL for upload preview). When set, hasImage is ignored for choosing src. */
  srcOverride?: string | null
}

export default function ProfileAvatar({
  hasImage,
  cacheKey,
  displayName,
  initials,
  size = 'md',
  className = '',
  imageClassName = 'object-cover',
  srcOverride,
}: ProfileAvatarProps) {
  const [imageError, setImageError] = useState(false)

  // Reset error when src changes so a new/updated image can be shown
  useEffect(() => {
    setImageError(false)
  }, [cacheKey, srcOverride])

  const sizeClass = sizeClasses[size]
  const initialsClass = initialsSizeClasses[size]

  // Use external URL directly (e.g. Google avatar); otherwise our API endpoint
  const effectiveSrc: string | null = srcOverride
    ? srcOverride
    : hasImage && cacheKey && isAbsoluteImageUrl(cacheKey)
      ? cacheKey
      : hasImage
        ? cacheKey && !srcOverride
          ? `${PROFILE_IMAGE_URL}${PROFILE_IMAGE_URL.includes('?') ? '&' : '?'}v=${encodeURIComponent(cacheKey)}`
          : PROFILE_IMAGE_URL
        : null

  const showImage = effectiveSrc && !imageError

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden bg-blue-700 flex-shrink-0 ${sizeClass} ${className}`.trim()}
    >
      {showImage ? (
        <img
          src={effectiveSrc}
          alt={displayName}
          className={`h-full w-full ${imageClassName}`.trim()}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className={`font-semibold text-white ${initialsClass}`.trim()} aria-hidden>
          {initials}
        </span>
      )}
    </div>
  )
}

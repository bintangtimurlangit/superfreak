'use client'

/**
 * Current user's profile avatar.
 *
 * Important: when using the NestJS backend on a different origin (NEXT_PUBLIC_API_URL),
 * the auth cookie typically lives on the API origin, not the Next.js origin. In that
 * case, we must load the image directly from the API origin so the browser sends the
 * correct cookie. When NEXT_PUBLIC_API_URL is not set, fall back to same-origin proxy.
 *
 * We intentionally use a plain <img> (not next/image) to avoid optimizer fetching
 * without user cookies.
 */
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
const PROFILE_IMAGE_URL = API_ORIGIN
  ? `${API_ORIGIN}/api/users/me/profile-image`
  : '/api/users/me/profile-image'

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
  const sizeClass = sizeClasses[size]
  const initialsClass = initialsSizeClasses[size]
  const showImage = hasImage || !!srcOverride
  const srcBase = srcOverride ?? (hasImage ? PROFILE_IMAGE_URL : null)
  const src =
    srcBase && cacheKey && !srcOverride
      ? `${srcBase}${srcBase.includes('?') ? '&' : '?'}v=${encodeURIComponent(cacheKey)}`
      : srcBase

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden bg-blue-700 flex-shrink-0 ${sizeClass} ${className}`.trim()}
    >
      {showImage && src ? (
        <img
          src={src}
          alt={displayName}
          className={`h-full w-full ${imageClassName}`.trim()}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className={`font-semibold text-white ${initialsClass}`.trim()} aria-hidden>
          {initials}
        </span>
      )}
    </div>
  )
}

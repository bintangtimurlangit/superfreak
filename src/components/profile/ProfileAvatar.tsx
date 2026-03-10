'use client'

/**
 * Current user's profile avatar. Uses a plain <img> for the authenticated
 * profile image so the browser sends the cookie to /api/users/me/profile-image.
 * No Next/Image to avoid optimizer fetching without cookies (401/500).
 */
const PROFILE_IMAGE_URL = '/api/users/me/profile-image'

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
  const src = srcOverride ?? (hasImage ? PROFILE_IMAGE_URL : null)

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

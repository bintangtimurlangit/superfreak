'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Upload } from 'lucide-react'
import Button from '@/components/ui/Button'
import Image from 'next/image'
import { useSession } from '@/hooks/useSession'

export default function EditProfileForm() {
  const router = useRouter()
  const { user: sessionUser, isSuccess: isAuthenticated, refreshSession, loading } = useSession()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [currentProfilePictureId, setCurrentProfilePictureId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize form with user data
  useEffect(() => {
    if (!loading && sessionUser && !initialized) {
      setName(sessionUser.name || '')
      setEmail(sessionUser.email || '')
      setPhoneNumber(sessionUser.phoneNumber || '')
      
      // Set existing profile picture preview if available
      if (sessionUser.profilePicture) {
        if (typeof sessionUser.profilePicture === 'object') {
          const profilePic = sessionUser.profilePicture as any
          const url = profilePic.url || profilePic.thumbnailURL || profilePic.sizes?.thumbnail?.url
          if (url) {
            setPreviewUrl(url)
          }
          // Store the current profile picture ID
          if (profilePic.id) {
            setCurrentProfilePictureId(profilePic.id)
          }
        } else if (typeof sessionUser.profilePicture === 'string') {
          setCurrentProfilePictureId(sessionUser.profilePicture)
        }
      }
      
      setInitialized(true)
    }
  }, [loading, sessionUser, initialized])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG or JPG)')
      e.target.value = ''
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File size must be less than 5 MB')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onerror = () => {
      alert('Failed to read the selected file. Please try again.')
      e.target.value = ''
    }
    reader.onloadend = () => {
      if (reader.result) {
        setPreviewUrl(reader.result as string)
        setSelectedFile(file)
      } else {
        alert('Failed to read the selected file. Please try again.')
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const handleCancelPreview = () => {
    setPreviewUrl(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeletePicture = async () => {
    if (!confirm('Are you sure you want to delete your profile picture?')) {
      return
    }
    
    setSaving(true)
    try {
      // Remove profile picture from user
      const response = await fetch(`/api/app-users/${sessionUser?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ profilePicture: null }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete profile picture')
      }

      await refreshSession()
      
      setPreviewUrl(null)
      setSelectedFile(null)
      setCurrentProfilePictureId(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error deleting profile picture:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated || !sessionUser?.id) {
      alert('Please sign in to update your profile')
      return
    }

    setSaving(true)

    try {
      let profilePictureId: string | null = null

      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)

        const uploadResponse = await fetch('/api/profile-pictures', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { message: errorText || 'Failed to upload profile picture' }
          }
          
          if (uploadResponse.status === 403) {
            throw new Error('Access denied. Your session may have expired. Please sign in again.')
          }
          
          throw new Error(errorData.message || `Failed to upload profile picture (${uploadResponse.status})`)
        }

        const uploadedFile = await uploadResponse.json()
        profilePictureId = uploadedFile.doc?.id || uploadedFile.id || null

        if (!profilePictureId) {
          throw new Error('Failed to get profile picture ID after upload')
        }
      }

      const updateData: {
        name?: string
        phoneNumber?: string
        profilePicture?: string | null
      } = {}

      if (name.trim()) {
        updateData.name = name.trim()
      }

      if (phoneNumber.trim()) {
        updateData.phoneNumber = phoneNumber.trim()
      }

      if (profilePictureId) {
        updateData.profilePicture = profilePictureId
      }

      const response = await fetch(`/api/app-users/${sessionUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to update profile')
      }

      await refreshSession()

      setPreviewUrl(null)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 md:p-5">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[#1D0DF3] rounded-[12px] flex items-center justify-center flex-shrink-0">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2
            className="text-[24px] font-semibold text-[#292929]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Edit Profile
          </h2>
        </div>
      </div>

      <div className="border-t border-[#EFEFEF] -mx-4 md:-mx-5 mb-6"></div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="mb-6">
              <h2
                className="text-lg font-semibold text-[#292929] mb-1"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Personal Information
              </h2>
              <p
                className="text-sm text-[#989898]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Edit or complete your personal information
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-[#292929] mb-2"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-[#F8F8F8] text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[#292929] mb-2"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-[#F5F5F5] text-[#989898] text-sm cursor-not-allowed"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                />
                <p
                  className="mt-1 text-xs text-[#989898]"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-[#292929] mb-2"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg bg-[#F8F8F8] text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 lg:max-w-[400px]">
            <div className="border border-[#EFEFEF] rounded-lg p-6 bg-[#F8F8F8] h-full">
              <div className="mb-4">
                <h3
                  className="text-lg font-semibold text-[#292929] mb-1"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Profile Picture
                </h3>
                <p
                  className="text-sm text-[#989898] mb-4"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Upload or change your profile picture
                </p>
              </div>

              {previewUrl ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-blue-700 flex-shrink-0 border-2 border-white">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="text-center w-full">
                      <div
                        className="text-sm font-medium text-[#292929] truncate"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        {selectedFile?.name || 'Current Picture'}
                      </div>
                      {selectedFile?.size && (
                        <div
                          className="text-xs text-[#989898]"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          {formatFileSize(selectedFile.size)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {selectedFile ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCancelPreview}
                        disabled={saving}
                        className="w-full border border-[#DCDCDC] bg-white text-[#292929] hover:bg-[#F5F5F5] text-sm font-medium disabled:opacity-50"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        Cancel
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={saving}
                          className="flex-1 border border-[#DCDCDC] bg-white text-[#292929] hover:bg-[#F5F5F5] text-sm font-medium disabled:opacity-50"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          Change
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleDeletePicture}
                          disabled={saving}
                          className="flex-1 border border-red-300 bg-white text-red-600 hover:bg-red-50 text-sm font-medium disabled:opacity-50"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                  {selectedFile && (
                    <div
                      className="text-xs text-[#989898] text-center"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      Click &ldquo;Save My Profile&rdquo; to upload this picture
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 flex flex-col items-center">
                  <div className="flex items-center justify-center w-24 h-24 rounded-lg bg-blue-700 border-2 border-white">
                    <User className="h-12 w-12 text-white" />
                  </div>
                  <div
                    className="text-sm text-[#989898] space-y-1 text-center"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <p>Format: png or jpg</p>
                    <p>Maximum file size 5 MB</p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                    className="w-full !bg-[#1D0DF3] !text-white hover:!bg-[#1a0cd9] text-sm font-medium disabled:!opacity-50 disabled:!cursor-not-allowed disabled:hover:!bg-[#1D0DF3]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Picture
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="hidden"
                id="profile-picture-input"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#EFEFEF]">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            className="border border-[#DCDCDC] bg-white text-[#1D0DF3] hover:bg-[#F5F5F5] text-sm font-medium"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="secondary"
            disabled={saving}
            className="!bg-[#1D0DF3] !text-white hover:!bg-[#1a0cd9] text-sm font-medium disabled:!opacity-50 disabled:!cursor-not-allowed disabled:hover:!bg-[#1D0DF3]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            {saving ? 'Saving...' : 'Save My Profile'}
          </Button>
        </div>
      </form>
    </div>
  )
}

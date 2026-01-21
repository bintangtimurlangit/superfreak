'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Upload } from 'lucide-react'
import Button from '@/components/ui/Button'
import Image from 'next/image'
import { useSession, updateUser, authClient } from '@/lib/auth/client'

function EditProfileFormSkeleton() {
  return (
    <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 md:p-5">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-[12px] animate-pulse flex-shrink-0" />
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="border-t border-[#EFEFEF] -mx-4 md:-mx-5 mb-6"></div>

      <div className="space-y-8">
        <section className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="mb-6">
              <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>

            <div className="space-y-4">
              <div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>

              <div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-3 w-40 bg-gray-200 rounded animate-pulse mt-1" />
              </div>

              <div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex-1 lg:max-w-[400px]">
            <div className="border border-[#EFEFEF] rounded-lg p-6 bg-[#F8F8F8] h-full">
              <div className="mb-4">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-4 w-56 bg-gray-200 rounded animate-pulse mb-4" />
              </div>

              <div className="space-y-4 flex flex-col items-center">
                <div className="w-24 h-24 rounded-lg bg-gray-200 animate-pulse border-2 border-white" />
                <div className="space-y-1 text-center">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mx-auto" />
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mx-auto" />
                </div>
                <div className="w-full h-10 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#EFEFEF]">
          <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default function EditProfileForm() {
  const router = useRouter()
  const { data: sessionData, isPending: loading, refetch: refetchSession } = useSession()
  const sessionUser = sessionData?.user || null
  const isAuthenticated = !!sessionUser
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [originalFileSize, setOriginalFileSize] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const compressImage = useCallback(async (file: File, maxSizeMB: number = 2): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new window.Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          const maxDimension = 1920
          if (width > height) {
            if (width > maxDimension) {
              height = (height / width) * maxDimension
              width = maxDimension
            }
          } else {
            if (height > maxDimension) {
              width = (width / height) * maxDimension
              height = maxDimension
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          const maxSizeBytes = maxSizeMB * 1024 * 1024

          let minQuality = 0.1
          let maxQuality = 0.95

          const tryCompress = (q: number): Promise<Blob> => {
            return new Promise<Blob>((resolveBlob) => {
              canvas.toBlob(
                (blob) => {
                  resolveBlob(blob || new Blob())
                },
                'image/jpeg',
                q,
              )
            })
          }

          const compress = async () => {
            let attempts = 0
            const maxAttempts = 10
            let quality = 0.92
            let compressedBlob: Blob | null = null

            while (attempts < maxAttempts) {
              quality = (minQuality + maxQuality) / 2
              compressedBlob = await tryCompress(quality)

              if (compressedBlob.size <= maxSizeBytes) {
                minQuality = quality
                if (maxQuality - minQuality < 0.05) break
              } else {
                maxQuality = quality
              }

              attempts++
            }

            compressedBlob = await tryCompress(quality)

            if (compressedBlob.size > maxSizeBytes) {
              width = Math.floor(width * 0.9)
              height = Math.floor(height * 0.9)
              canvas.width = width
              canvas.height = height
              ctx.drawImage(img, 0, 0, width, height)
              compressedBlob = await tryCompress(0.85)
            }

            const compressedFile = new File(
              [compressedBlob],
              file.name.replace(/\.[^/.]+$/, '.jpg'),
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              },
            )

            resolve(compressedFile)
          }

          compress().catch(reject)
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        if (e.target?.result) {
          img.src = e.target.result as string
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && sessionUser && !initialized) {
      setName(sessionUser.name || '')
      setEmail(sessionUser.email || '')
      setPhoneNumber((sessionUser as any).phoneNumber || '')

      if (sessionUser.image) {
        setPreviewUrl(sessionUser.image)
      }

      setInitialized(true)
    }
  }, [loading, sessionUser, initialized])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]

      if (!file) return

      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (PNG or JPG)')
        e.target.value = ''
        return
      }

      const maxSize = 2 * 1024 * 1024
      setOriginalFileSize(file.size)
      setCompressing(true)

      try {
        let fileToUse = file

        if (file.size > maxSize || file.size > 500 * 1024) {
          fileToUse = await compressImage(file, 2)
        }

        if (fileToUse.size > maxSize) {
          alert('Unable to compress image to under 2MB. Please select a smaller image.')
          e.target.value = ''
          setCompressing(false)
          setOriginalFileSize(null)
          return
        }

        const reader = new FileReader()
        reader.onerror = () => {
          alert('Failed to read the selected file. Please try again.')
          e.target.value = ''
          setCompressing(false)
          setOriginalFileSize(null)
        }
        reader.onloadend = () => {
          if (reader.result) {
            setPreviewUrl(reader.result as string)
            setSelectedFile(fileToUse)
            setCompressing(false)
          } else {
            alert('Failed to read the selected file. Please try again.')
            setCompressing(false)
            setOriginalFileSize(null)
          }
        }
        reader.readAsDataURL(fileToUse)
      } catch (error) {
        console.error('Error compressing image:', error)
        alert('Failed to process image. Please try again.')
        e.target.value = ''
        setCompressing(false)
        setOriginalFileSize(null)
      }
    },
    [compressImage],
  )

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
      await updateUser({
        image: undefined,
        fetchOptions: {
          onSuccess: () => {
            router.refresh()
            setPreviewUrl(null)
            setSelectedFile(null)
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
          },
          onError: (error) => {
            console.error('Error deleting profile picture:', error)
            alert(error.error?.message || 'Failed to delete profile picture')
          },
        },
      })
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
      let imageUrl: string | undefined = undefined
      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)

        const uploadResponse = await fetch('/api/profile-image', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to upload profile image')
        }

        const uploadData = await uploadResponse.json()
        imageUrl = uploadData.url

        if (!imageUrl) {
          throw new Error('Failed to get image URL after upload')
        }

        console.log('[EditProfileForm] Image uploaded to S3:', {
          url: imageUrl,
          length: imageUrl.length,
        })
      }

      console.log('[EditProfileForm] Updating user with:', {
        hasName: !!name.trim(),
        hasImage: !!imageUrl,
        imageUrl: imageUrl?.substring(0, 50) + '...',
        hasPhoneNumber: !!phoneNumber.trim(),
      })

      await updateUser({
        name: name.trim() || undefined,
        image: imageUrl || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        fetchOptions: {
          onSuccess: async () => {
            console.log('[EditProfileForm] Update successful, refreshing session...')
            await new Promise((resolve) => setTimeout(resolve, 500))
            try {
              const newSession = await authClient.getSession()
              console.log('[EditProfileForm] Session refreshed:', {
                hasUser: !!newSession?.data?.user,
                hasImage: !!newSession?.data?.user?.image,
                imageUrl: newSession?.data?.user?.image?.substring(0, 50),
              })
              if (authClient.$store) {
                authClient.$store.notify('$sessionSignal')
              }
            } catch (error) {
              console.error('[EditProfileForm] Error refreshing session:', error)
            }
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('session-updated'))
            }
            setPreviewUrl(null)
            setSelectedFile(null)
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
          },
          onError: (error) => {
            console.error('[EditProfileForm] Error updating profile:', error)
            alert(error.error?.message || 'Failed to update profile')
          },
        },
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
      router.refresh()
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (!mounted || loading) {
    return <EditProfileFormSkeleton />
  }

  if (!isAuthenticated || !sessionUser) {
    return null
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
                        <div className="space-y-1">
                          <div
                            className="text-xs text-[#989898]"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            {formatFileSize(selectedFile.size)}
                            {originalFileSize && originalFileSize > selectedFile.size && (
                              <span className="text-green-600 ml-1">
                                (compressed from {formatFileSize(originalFileSize)})
                              </span>
                            )}
                          </div>
                          {selectedFile.size > 2 * 1024 * 1024 && (
                            <div
                              className="text-xs text-red-600 font-medium"
                              style={{ fontFamily: 'var(--font-geist-sans)' }}
                            >
                              ⚠️ File size exceeds 2MB limit
                            </div>
                          )}
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
                    <p className="font-medium text-[#292929]">Maximum file size: 2 MB</p>
                    <p className="text-xs">Images will be automatically compressed</p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving || compressing}
                    className="w-full !bg-[#1D0DF3] !text-white hover:!bg-[#1a0cd9] text-sm font-medium disabled:!opacity-50 disabled:!cursor-not-allowed disabled:hover:!bg-[#1D0DF3]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    {compressing ? (
                      <>
                        <span className="mr-2 inline-block h-4 w-4 animate-spin border-2 border-white border-r-transparent rounded-full" />
                        Compressing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Picture
                      </>
                    )}
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

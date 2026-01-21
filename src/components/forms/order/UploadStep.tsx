'use client'

import { useState, useRef } from 'react'
import { Box, Trash2, ChevronRight, ArrowUp, Shield, Minus, Plus, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { parseConfigurationValues } from '@/lib/validations/order'

export interface ModelConfiguration {
  material?: string
  color?: string
  layerHeight?: string
  quantity?: number
  support?: boolean
  enabled?: boolean
  infill?: string
  wallCount?: string
  specialRequest?: string
  [key: string]: string | number | boolean | undefined
}

export interface UploadedFile {
  id: string
  name: string
  size: number
  dimensions?: string
  progress?: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  configuration?: ModelConfiguration
  file?: File // Store the actual File object for API upload
  statistics?: {
    print_time_minutes: number
    print_time_formatted: string
    filament_length_mm: number
    filament_volume_cm3: number
    filament_weight_g: number
    filament_type: string
    layer_height: number
    infill_density: number
    wall_count: number
  }
}

interface UploadStepProps {
  uploadedFiles: UploadedFile[]
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>
  onNext: () => void
  onConfigure?: (fileId: string) => void
}

export default function UploadStep({
  uploadedFiles,
  setUploadedFiles,
  onNext,
  onConfigure,
}: UploadStepProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const maxFiles = 5
  const maxFileSize = 500 * 1024 * 1024 // 500 MB

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(0) + ' MB'
  }

  const processFiles = (files: FileList | File[]) => {
    // Filter only 3D file formats
    const allowedExtensions = [
      '.stl',
      '.obj',
      '.step',
      '.stp',
      '.x_t',
      '.iges',
      '.igs',
      '.sldprt',
      '.3mf',
      '.amf',
      '.ply',
      '.dae',
      '.fbx',
      '.gltf',
      '.glb',
    ]
    const validFiles = Array.from(files).filter((file) => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase()
      return allowedExtensions.includes(extension)
    })

    if (validFiles.length === 0) {
      alert(
        'Please select a valid 3D file format (.stl, .obj, .step, .stp, .x_t, .iges, .igs, .sldprt, .3mf, .amf, .ply, .dae, .fbx, .gltf, .glb)',
      )
      return
    }

    const newFiles: UploadedFile[] = validFiles
      .slice(0, maxFiles - uploadedFiles.length)
      .map((file) => ({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: file.size,
        status: 'pending' as const,
        progress: 0,
        file: file, // Store the File object for API upload
        configuration: {
          quantity: 1,
          enabled: true,
          wallCount: '2',
        },
      }))

    setUploadedFiles((prev) => [...prev, ...newFiles])
  }

  const uploadToBackend = async (fileId: string, file: File, config: ModelConfiguration) => {
    const apiUrl = process.env.NEXT_PUBLIC_SUPERSLICE_API_URL || 'http://localhost:8000'
    console.log(`[SuperSlice] uploadToBackend called for ${file.name}`)
    console.log(`[SuperSlice] API URL: ${apiUrl}`)

    // Only process STL and 3MF files for now (backend limitation)
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    console.log(`[SuperSlice] File extension: ${extension}`)

    if (!['.stl', '.3mf'].includes(extension)) {
      // For other file types, mark as completed without API call
      console.log(`[SuperSlice] File ${file.name} is not STL/3MF, skipping API call`)
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: 'completed' as const, progress: 100 } : f,
        ),
      )
      return
    }

    try {
      // Update progress to indicate processing
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, progress: 10, status: 'uploading' as const } : f,
        ),
      )

      // Validate configuration using Zod schema
      const validation = parseConfigurationValues({
        layerHeight: config.layerHeight,
        infill: config.infill,
        wallCount: config.wallCount,
      })

      if (!validation.valid) {
        throw new Error(
          `Configuration validation failed: ${validation.errors.join(', ')}. Please configure the model first.`,
        )
      }

      const { layerHeight, infillDensity, wallCount } = validation.values
      const filamentType = config.material?.toUpperCase() || 'PLA'

      // Prepare form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('layer_height', layerHeight.toString())
      formData.append('infill_density', infillDensity.toString())
      formData.append('wall_count', wallCount.toString())
      formData.append('filament_type', filamentType)

      console.log(`[SuperSlice] Sending request to ${apiUrl}/slice`)
      console.log(`[SuperSlice] Parameters:`, {
        layer_height: layerHeight,
        infill_density: infillDensity,
        wall_count: wallCount,
        filament_type: filamentType,
        file_size: file.size,
        file_name: file.name,
      })

      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, progress: 30, status: 'uploading' as const } : f,
        ),
      )

      // Call the backend API
      const response = await fetch(`${apiUrl}/slice`, {
        method: 'POST',
        body: formData,
      })

      console.log(`[SuperSlice] Response status: ${response.status}`)

      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, progress: 70, status: 'uploading' as const } : f,
        ),
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const statistics = await response.json()

      // Log statistics to console
      console.log(`[SuperSlice] Statistics for ${file.name}:`, statistics)

      // Update file with statistics and mark as completed
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: 'completed' as const,
                progress: 100,
                statistics: statistics,
              }
            : f,
        ),
      )
    } catch (error) {
      console.error(`[SuperSlice] Error processing ${file.name}:`, error)
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: 'error' as const,
                progress: 0,
              }
            : f,
        ),
      )
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    processFiles(files)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processFiles(files)
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const removeAllFiles = () => {
    setUploadedFiles([])
  }

  const isModelConfigured = (file: UploadedFile): boolean => {
    if (!file.configuration) return false
    return !!(
      file.configuration.material &&
      file.configuration.color &&
      file.configuration.layerHeight &&
      file.configuration.infill
    )
  }

  const allModelsConfigured = (): boolean => {
    return uploadedFiles
      .filter((f) => f.status === 'completed' || f.status === 'pending')
      .every((f) => isModelConfigured(f))
  }

  const processAllFiles = async () => {
    console.log('[SuperSlice] processAllFiles called')
    console.log('[SuperSlice] uploadedFiles:', uploadedFiles)
    console.log('[SuperSlice] allModelsConfigured:', allModelsConfigured())

    if (!allModelsConfigured()) {
      console.log('[SuperSlice] Not all models configured, returning')
      return
    }

    setIsProcessing(true)

    // Get all files that need processing:
    // - Pending files
    // - Completed files without statistics (need initial processing or re-processing after config change)
    const filesToProcess = uploadedFiles.filter(
      (f) => f.status === 'pending' || (f.status === 'completed' && f.file && !f.statistics),
    )

    console.log('[SuperSlice] filesToProcess:', filesToProcess)
    console.log(
      '[SuperSlice] filesToProcess details:',
      filesToProcess.map((f) => ({
        id: f.id,
        name: f.name,
        status: f.status,
        hasFile: !!f.file,
        hasStatistics: !!f.statistics,
      })),
    )

    if (filesToProcess.length === 0) {
      // Check if there are files that should be processed but don't have File objects
      const filesWithoutFileObject = uploadedFiles.filter(
        (f) => (f.status === 'pending' || f.status === 'completed') && !f.file && !f.statistics,
      )

      if (filesWithoutFileObject.length > 0) {
        console.warn(
          '[SuperSlice] Files need processing but are missing File objects (likely restored from sessionStorage):',
          filesWithoutFileObject.map((f) => f.name),
        )
        alert('Some files need to be re-uploaded. Please remove and re-add them to process them.')
        setIsProcessing(false)
        return
      }

      // All files already processed, proceed to next step
      console.log('[SuperSlice] No files to process, proceeding to next step')
      setIsProcessing(false)
      onNext()
      return
    }

    // Process all files in parallel
    const processPromises = filesToProcess.map(async (uploadedFile) => {
      if (!uploadedFile.file) {
        console.warn(
          `[SuperSlice] File ${uploadedFile.name} (${uploadedFile.id}) has no File object, skipping`,
        )
        return { success: true, fileId: uploadedFile.id }
      }

      console.log(`[SuperSlice] Processing file: ${uploadedFile.name} (${uploadedFile.id})`)
      try {
        await uploadToBackend(
          uploadedFile.id,
          uploadedFile.file,
          uploadedFile.configuration || {
            quantity: 1,
            enabled: true,
            wallCount: '2',
          },
        )
        console.log(`[SuperSlice] Successfully processed: ${uploadedFile.name}`)
        return { success: true, fileId: uploadedFile.id }
      } catch (error) {
        console.error(`[SuperSlice] Error processing ${uploadedFile.name}:`, error)
        return { success: false, fileId: uploadedFile.id, error }
      }
    })

    try {
      const results = await Promise.all(processPromises)
      const allSucceeded = results.every((r) => r.success)

      if (allSucceeded) {
        // Small delay to ensure state updates have propagated
        await new Promise((resolve) => setTimeout(resolve, 200))
        onNext()
      } else {
        console.error('[SuperSlice] Some files failed to process')
      }
    } catch (error) {
      console.error('[SuperSlice] Error processing files:', error)
      // Don't proceed if there are errors
    } finally {
      setIsProcessing(false)
    }
  }

  const updateQuantity = (fileId: string, delta: number) => {
    setUploadedFiles((prev) =>
      prev.map((file) => {
        if (file.id === fileId) {
          const currentQty = file.configuration?.quantity || 1
          const newQty = Math.max(1, currentQty + delta)
          return {
            ...file,
            configuration: {
              ...file.configuration,
              quantity: newQty,
            },
          }
        }
        return file
      }),
    )
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 md:p-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[#1D0DF3] rounded-[12px] flex items-center justify-center flex-shrink-0">
            <ArrowUp className="h-6 w-6 text-white" />
          </div>
          <h2
            className="text-[24px] font-semibold text-[#292929]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Upload your 3D model
          </h2>
        </div>
      </div>

      {/* Divider Line - spans full width */}
      <div className="border-t border-[#EFEFEF] -mx-4 md:-mx-5 mb-6"></div>

      {/* Security and Upload Limit Info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#292929]" />
          <span className="text-xs text-[#656565]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
            Your files are securely stored and kept private.
          </span>
        </div>
        <span className="text-xs text-[#7C7C7C]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
          *Maximum Upload: {maxFiles} Models.
        </span>
      </div>

      {/* Upload Area */}
      {uploadedFiles.length < maxFiles && (
        <div>
          {uploadedFiles.length > 0 ? (
            // Compact layout when files are already uploaded
            <div
              className={`rounded-[12px] border border-dashed p-4 flex items-center gap-4 transition-colors ${
                isDragging ? 'border-[#1D0DF3] bg-[#1D0DF3]/5' : 'border-[#DCDCDC] bg-[#F8F8F8]'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-[8px] bg-white flex items-center justify-center">
                <Box className="h-5 w-5 text-[#292929]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold text-[#292929] mb-1">
                  Upload Another 3D Models
                </div>
                <div
                  className="text-xs text-[#6b7280]"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Supported formats: .stl, .obj, .step, .stp, .x_t, .iges, .igs, .sldprt, .3mf,
                  .amf, .ply, .dae, .fbx, .gltf, .glb (Max: {formatFileSize(maxFileSize)} per file)
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".stl,.obj,.step,.stp,.x_t,.iges,.igs,.sldprt,.3mf,.amf,.ply,.dae,.fbx,.gltf,.glb"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="h-10 px-4 gap-2 rounded-[12px] border border-[#292929] !bg-[#292929] text-white hover:!bg-[#333333] shadow-[inset_0_0_0_2px_rgba(126,126,126,0.25)] text-sm font-medium flex-shrink-0"
              >
                Browse Files
              </Button>
            </div>
          ) : (
            // Full layout when no files uploaded yet
            <div
              className={`rounded-[12px] border border-dashed p-8 flex flex-col items-center justify-center text-center transition-colors min-h-[480px] ${
                isDragging ? 'border-[#1D0DF3] bg-[#1D0DF3]/5' : 'border-[#DCDCDC] bg-[#F8F8F8]'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="mb-3 mx-auto flex h-12 w-12 items-center justify-center">
                <Box className="h-8 w-8 text-[#292929]" />
              </div>
              <div className="mb-1 text-base font-semibold text-[#292929]">Upload 3D Models</div>
              <div
                className="text-sm text-[#6b7280] mb-4"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Supported formats: .stl, .obj, .step, .stp, .x_t, .iges, .igs, .sldprt, .3mf, .amf,
                .ply, .dae, .fbx, .gltf, .glb
                <br />
                (Max: {formatFileSize(maxFileSize)} per file)
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".stl,.obj,.step,.stp,.x_t,.iges,.igs,.sldprt,.3mf,.amf,.ply,.dae,.fbx,.gltf,.glb"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="h-11 px-6 gap-2 rounded-[12px] border border-[#292929] !bg-[#292929] text-white hover:!bg-[#333333] shadow-[inset_0_0_0_2px_rgba(126,126,126,0.25)] text-sm font-medium"
              >
                Browse Files
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Uploaded Models List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-lg font-semibold text-[#292929]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Uploaded Models
            </h3>
            {uploadedFiles.length > 1 && (
              <button
                onClick={removeAllFiles}
                className="text-sm text-red-500 hover:text-red-600 transition-colors"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Delete All Models
              </button>
            )}
          </div>
          <div className="space-y-3">
            {uploadedFiles.map((file) => {
              const isConfigured =
                file.status === 'completed' || file.status === 'pending'
                  ? isModelConfigured(file)
                  : false
              const hasError = file.status === 'error'
              const needsConfiguration =
                (file.status === 'completed' || file.status === 'pending') && !isConfigured
              return (
                <div
                  key={file.id}
                  className={`p-4 bg-white rounded-[12px] border ${
                    hasError
                      ? 'border-red-300 bg-red-50/30'
                      : needsConfiguration
                        ? 'border-orange-300 bg-orange-50/30'
                        : 'border-[#EFEFEF]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Left: Thumbnail */}
                    <div className="flex-shrink-0 w-20 h-20 bg-[#F8F8F8] rounded-[8px] border border-[#EFEFEF] flex items-center justify-center">
                      {file.status === 'uploading' && (
                        <div className="h-6 w-6 border-2 border-[#1D0DF3] border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {(file.status === 'completed' || file.status === 'pending') && (
                        <div className="w-full h-full bg-[#F8F8F8] rounded-[8px] flex items-center justify-center">
                          <Box className="h-8 w-8 text-[#DCDCDC]" />
                        </div>
                      )}
                    </div>

                    {/* Middle: File Information */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-base font-semibold text-[#292929] truncate"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          {file.name}
                        </span>
                        {(file.status === 'completed' || file.status === 'pending') &&
                          !isConfigured && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-xs font-medium">
                              <AlertCircle className="h-3 w-3" />
                              Not Configured
                            </span>
                          )}
                        {(file.status === 'completed' || file.status === 'pending') &&
                          isConfigured && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                              <svg
                                className="h-3 w-3"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                              >
                                <path
                                  d="M12.6667 4.66669L6.00004 11.3334L3.33337 8.66669"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              Configured
                            </span>
                          )}
                        {file.status === 'error' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                            <AlertCircle className="h-3 w-3" />
                            Upload Failed
                          </span>
                        )}
                      </div>
                      <div
                        className="text-xs text-[#7C7C7C]"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        {file.dimensions || '12 x 8 x 20 cm'} - ({formatFileSize(file.size)})
                      </div>
                      {(file.status === 'completed' || file.status === 'pending') &&
                        !isConfigured && (
                          <div
                            className="mt-2 text-xs text-orange-600"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            Please configure material, color, line height, and infill before
                            proceeding.
                          </div>
                        )}
                      {file.status === 'error' && (
                        <div
                          className="mt-2 text-xs text-red-600"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          Upload failed. Please remove this file and try uploading again.
                        </div>
                      )}
                      {(file.status === 'completed' || file.status === 'pending') &&
                        isConfigured && (
                          <div
                            className="mt-2 text-xs text-[#656565] space-y-0.5"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            <div>Material: {file.configuration?.material || '-'}</div>
                            <div>Color: {file.configuration?.color || '-'}</div>
                            <div>Line Height: {file.configuration?.layerHeight || '-'}</div>
                            <div>Infill: {file.configuration?.infill || '-'}</div>
                            <div>Walls: {file.configuration?.wallCount || '2'}</div>
                          </div>
                        )}
                      {file.status === 'uploading' && file.progress !== undefined && (
                        <div className="mt-2 space-y-1">
                          <div
                            className="text-xs text-[#656565]"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            Uploading your model.. ({file.progress}%)
                          </div>
                          <div className="w-full bg-[#EFEFEF] rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#1D0DF3] h-full transition-all duration-200"
                              style={{ width: `${file.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Controls */}
                    {(file.status === 'completed' || file.status === 'pending') && (
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Configure Button */}
                        <Button
                          onClick={() => onConfigure?.(file.id)}
                          className={`h-10 px-4 rounded-[12px] text-sm font-medium ${
                            !isConfigured
                              ? 'border border-[#1D0DF3] !bg-[#1D0DF3] text-white hover:!bg-[#1a0bd4]'
                              : 'border border-[#EFEFEF] !bg-white text-[#292929] hover:!bg-[#F8F8F8]'
                          }`}
                        >
                          {isConfigured ? 'Edit Config' : 'Configure'}
                        </Button>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-2 bg-[#F8F8F8] rounded-full px-2 py-1.5">
                          <button
                            onClick={() => updateQuantity(file.id, -1)}
                            className="p-1 hover:bg-white rounded-full transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4 text-[#292929]" />
                          </button>
                          <span
                            className="text-sm font-medium text-[#292929] min-w-[2rem] text-center"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            {file.configuration?.quantity || 1}
                          </span>
                          <button
                            onClick={() => updateQuantity(file.id, 1)}
                            className="p-1 hover:bg-white rounded-full transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4 text-[#292929]" />
                          </button>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => removeFile(file.id)}
                          className="flex items-center gap-1.5 text-[#7C7C7C] hover:text-[#292929] transition-colors"
                          aria-label="Delete file"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span
                            className="text-sm"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            Delete
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Navigation for Step 1 */}
      {uploadedFiles.length > 0 &&
        uploadedFiles.every((f) => f.status === 'completed' || f.status === 'pending') && (
          <div className="flex justify-end mt-6">
            <Button
              onClick={() => {
                console.log('[SuperSlice] Button clicked - processAllFiles')
                processAllFiles()
              }}
              disabled={!allModelsConfigured() || isProcessing}
              className="h-11 px-6 gap-2 rounded-[12px] border border-[#1D0DF3] !bg-[#1D0DF3] text-white hover:!bg-[#1a0bd4] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:!bg-[#1D0DF3]"
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing Models...
                </>
              ) : (
                <>
                  Proceed to Order Summary
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
    </div>
  )
}

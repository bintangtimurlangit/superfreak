import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500 MB
const TEMP_EXPIRY_HOURS = 24

interface TempFileResponse {
  tempFileId: string
  fileName: string
  fileSize: number
  expiresAt: string
}

/**
 * Temporary file upload endpoint
 * Uploads files to Payload's user-files collection via REST API
 * Files are stored with temp prefix and can be finalized later
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const sessionId = (formData.get('sessionId') as string) || randomUUID()

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Validate file sizes
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        )
      }
    }

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + TEMP_EXPIRY_HOURS)

    const uploadedFiles: TempFileResponse[] = []
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

    // Upload each file to Payload via REST API
    for (const file of files) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''
      
      // Determine file type
      const fileType = fileExtension === 'stl' ? 'stl' : 
                      fileExtension === 'obj' ? 'obj' :
                      fileExtension === 'glb' || fileExtension === 'gltf' ? 'glb' : 'other'

      // Create FormData for Payload upload
      const payloadFormData = new FormData()
      payloadFormData.append('file', file)
      payloadFormData.append('fileType', fileType)
      payloadFormData.append('filename', file.name)

      // Upload to Payload's REST API
      const uploadResponse = await fetch(`${baseUrl}/api/user-files`, {
        method: 'POST',
        body: payloadFormData,
        headers: {
          // Payload will handle authentication via cookies
        },
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(errorData.error || `Failed to upload ${file.name}`)
      }

      const fileDoc = await uploadResponse.json()

      uploadedFiles.push({
        tempFileId: fileDoc.doc?.id || fileDoc.id,
        fileName: file.name,
        fileSize: file.size,
        expiresAt: expiresAt.toISOString(),
      })
    }

    return NextResponse.json({
      sessionId,
      files: uploadedFiles,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('Error uploading temp files:', error)
    return NextResponse.json(
      { error: 'Failed to upload files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

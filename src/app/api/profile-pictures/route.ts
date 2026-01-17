import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    let token = request.cookies.get('payload-token-app-users')?.value
    
    if (!token) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('JWT ')) {
        token = authHeader.substring(4)
      }
    }

    if (!token) {
      return NextResponse.json(
        { errors: [{ message: 'Unauthorized - Please sign in' }] },
        { status: 401 }
      )
    }

    const secret = process.env.PAYLOAD_SECRET
    if (!secret) {
      console.error('[Upload Profile Picture] PAYLOAD_SECRET is not configured')
      return NextResponse.json(
        { errors: [{ message: 'Server configuration error' }] },
        { status: 500 }
      )
    }

    // Verify and decode the JWT
    const decoded = jwt.verify(token, secret) as {
      id: string
      email: string
      collection: string
    }

    if (!decoded || !decoded.id || decoded.collection !== 'app-users') {
      return NextResponse.json(
        { errors: [{ message: 'Invalid authentication token' }] },
        { status: 401 }
      )
    }

    console.log('[Upload Profile Picture] Authenticated user:', {
      userId: decoded.id,
      email: decoded.email,
    })

    // Get the file from the form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { errors: [{ message: 'No file provided' }] },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { errors: [{ message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' }] },
        { status: 400 }
      )
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { errors: [{ message: 'File size exceeds 2MB limit' }] },
        { status: 400 }
      )
    }

    console.log('[Upload Profile Picture] File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
    })

    // Upload to Payload
    const payload = await getPayload({ config })
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Create the upload
    const uploadedFile = await payload.create({
      collection: 'profile-pictures',
      data: {},
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
    })

    console.log('[Upload Profile Picture] Upload successful:', {
      id: uploadedFile.id,
      filename: uploadedFile.filename,
    })

    return NextResponse.json({ 
      doc: uploadedFile,
      id: uploadedFile.id,
    }, { status: 201 })
    
  } catch (error) {
    console.error('[Upload Profile Picture] Error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { errors: [{ message: 'Invalid authentication token' }] },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { errors: [{ message: error instanceof Error ? error.message : 'Failed to upload profile picture' }] },
      { status: 500 }
    )
  }
}

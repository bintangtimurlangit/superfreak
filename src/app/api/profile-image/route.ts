import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload()
    const requestHeaders = await headers()

    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 },
      )
    }

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 2MB limit' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadedFile = await payload.create({
      collection: 'media',
      data: {
        alt: `Profile picture for ${user.email}`,
      },
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
      req: {
        user: {
          ...user,
          collection: 'app-users',
          id: user.id,
        },
        payload,
        headers: requestHeaders,
      } as any,
      overrideAccess: false,
    })

    const imageUrl =
      uploadedFile.url || uploadedFile.sizes?.thumbnail?.url || uploadedFile.sizes?.small?.url

    if (!imageUrl) {
      return NextResponse.json({ error: 'Failed to get image URL after upload' }, { status: 500 })
    }

    console.log('[Profile Image Upload] Success:', {
      fileId: uploadedFile.id,
      url: imageUrl,
      userId: user.id,
    })

    return NextResponse.json(
      {
        url: imageUrl,
        id: uploadedFile.id,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[Profile Image Upload] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload profile image' },
      { status: 500 },
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'
import { withApiLogger } from '@/lib/api-logger'

// Verify API key with constant-time comparison to prevent timing attacks
function verifyApiKey(providedKey: string | null): boolean {
  const validKey = process.env.BLOG_API_KEY

  if (!validKey || !providedKey) {
    return false
  }

  // Use constant-time comparison to prevent timing attacks
  try {
    const validKeyBuffer = Buffer.from(validKey, 'utf-8')
    const providedKeyBuffer = Buffer.from(providedKey, 'utf-8')

    if (validKeyBuffer.length !== providedKeyBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(validKeyBuffer, providedKeyBuffer)
  } catch {
    return false
  }
}

// Download image from URL and upload to R2
async function downloadAndUploadImage(
  imageUrl: string,
  title: string,
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<string> {
  try {
    // Download image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Get content type
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // Validate image type
    const allowedTypes = ['image/webp', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(contentType)) {
      throw new Error(`Invalid image type: ${contentType}`)
    }

    // Generate filename from URL
    const urlParts = imageUrl.split('/')
    const originalFilename = urlParts[urlParts.length - 1] || 'image.jpg'
    const filename = originalFilename.split('?')[0] // Remove query params

    // Upload to Media collection (which will upload to R2)
    const mediaDoc = await payload.create({
      collection: 'media',
      data: {
        alt: title,
      },
      file: {
        data: buffer,
        mimetype: contentType,
        name: filename,
        size: buffer.length,
      },
    })

    return mediaDoc.id
  } catch (error) {
    console.error('Image download/upload error:', error)
    throw new Error(
      `Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

export const POST = withApiLogger(async function createBlogPost(request: NextRequest) {
  try {
    // Extract and verify API key from Authorization header
    const authHeader = request.headers.get('authorization')
    const apiKey = authHeader?.replace('Bearer ', '') ?? null

    if (!verifyApiKey(apiKey)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Invalid or missing API key',
        },
        { status: 401 },
      )
    }

    const contentType = request.headers.get('content-type') || ''
    let postData: {
      title: string
      text: string
      categories: string[]
      image?: string
      source?: string
    }
    let imageFile: File | null = null

    // Handle JSON payload (with image URL)
    if (contentType.includes('application/json')) {
      try {
        postData = await request.json()
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid JSON payload',
          },
          { status: 400 },
        )
      }
    }
    // Handle multipart form data (with file upload)
    else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const dataString = formData.get('data') as string
      imageFile = formData.get('image') as File | null

      if (!dataString) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required field: data',
          },
          { status: 400 },
        )
      }

      try {
        postData = JSON.parse(dataString)
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid JSON in data field',
          },
          { status: 400 },
        )
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Content-Type must be application/json or multipart/form-data',
        },
        { status: 400 },
      )
    }

    // Validate required fields
    if (!postData.title || !postData.text || !postData.categories) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: title, text, or categories',
        },
        { status: 400 },
      )
    }

    if (!Array.isArray(postData.categories) || postData.categories.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'categories must be a non-empty array',
        },
        { status: 400 },
      )
    }

    // Get Payload instance
    const payload = await getPayload({ config })

    // Handle image upload
    let featuredImageId: string | undefined

    // Option 1: Image URL provided (download and upload to R2)
    if (postData.image) {
      try {
        featuredImageId = await downloadAndUploadImage(postData.image, postData.title, payload)
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to download and upload image',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 400 },
        )
      }
    }
    // Option 2: Image file provided via multipart
    else if (imageFile) {
      // Validate file type
      const allowedTypes = ['image/webp', 'image/jpeg', 'image/png']
      if (!allowedTypes.includes(imageFile.type)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid image type. Allowed: WebP, JPEG, PNG',
          },
          { status: 400 },
        )
      }

      // Convert File to Buffer
      const arrayBuffer = await imageFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Upload to Media collection
      const mediaDoc = await payload.create({
        collection: 'media',
        data: {
          alt: postData.title,
        },
        file: {
          data: buffer,
          mimetype: imageFile.type,
          name: imageFile.name,
          size: buffer.length,
        },
      })

      featuredImageId = mediaDoc.id
    }

    // Normalize categories to lowercase with hyphens
    const normalizedCategories = postData.categories.map((cat) =>
      cat.toLowerCase().replace(/\s+/g, '-'),
    )

    // Generate excerpt from first 200 characters of text
    const excerpt = postData.text.substring(0, 200).trim() + '...'

    // Create blog post
    const blogPost = await payload.create({
      collection: 'blog-posts',
      data: {
        title: postData.title,
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: postData.text,
                    version: 1,
                  },
                ],
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        } as any,
        excerpt,
        categories: normalizedCategories as any,
        featuredImage: featuredImageId,
        source: postData.source,
        author: 'Superfreak Team',
        _status: 'published', // Auto-publish
      },
    } as any)

    return NextResponse.json(
      {
        success: true,
        data: {
          id: (blogPost as any).id,
          slug: (blogPost as any).slug,
          title: (blogPost as any).title,
          url: `${process.env.NEXT_PUBLIC_SERVER_URL}/blog/${(blogPost as any).slug}`,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Blog creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
})

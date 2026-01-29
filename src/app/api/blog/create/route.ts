import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'

/**
 * Secure Blog Post Creation API
 *
 * This endpoint allows external systems to create blog posts via API.
 * Authentication is done via API key in the Authorization header.
 *
 * Usage:
 * POST /api/blog/create
 * Headers:
 *   Authorization: Bearer YOUR_BLOG_API_KEY
 *   Content-Type: multipart/form-data
 *
 * Body (multipart/form-data):
 *   - data: JSON string with { title, text, categories, source? }
 *   - image: File (WebP, JPEG, or PNG)
 */

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

export async function POST(request: NextRequest) {
  try {
    // Extract and verify API key from Authorization header
    const authHeader = request.headers.get('authorization')
    const apiKey = authHeader?.replace('Bearer ', '')

    if (!verifyApiKey(apiKey)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Invalid or missing API key',
        },
        { status: 401 },
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const dataString = formData.get('data') as string
    const imageFile = formData.get('image') as File | null

    if (!dataString) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: data',
        },
        { status: 400 },
      )
    }

    // Parse JSON data
    let postData: {
      title: string
      text: string
      categories: string[]
      source?: string
    }

    try {
      postData = JSON.parse(dataString)
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in data field',
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

    // Upload image if provided
    let featuredImageId: string | undefined

    if (imageFile) {
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
        content: postData.text,
        excerpt,
        categories: normalizedCategories,
        featuredImage: featuredImageId,
        source: postData.source,
        author: 'Superfreak Team',
        _status: 'published', // Auto-publish
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: blogPost.id,
          slug: blogPost.slug,
          title: blogPost.title,
          url: `${process.env.NEXT_PUBLIC_SERVER_URL}/blog/${blogPost.slug}`,
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
}

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Get Single Blog Post by Slug
 *
 * GET /api/blog/[slug]
 */

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params

    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'blog-posts',
      where: {
        slug: { equals: slug },
        _status: { equals: 'published' },
      },
      limit: 1,
      depth: 1, // Populate featuredImage
    })

    if (result.docs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Blog post not found',
        },
        { status: 404 },
      )
    }

    const post = result.docs[0]

    return NextResponse.json({
      success: true,
      data: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        author: post.author,
        date: post.publishedAt || post.createdAt,
        readTime: post.readTime,
        categories: post.categories,
        image: typeof post.featuredImage === 'object' ? post.featuredImage?.url : null,
        source: post.source,
      },
    })
  } catch (error) {
    console.error('Blog fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch blog post',
      },
      { status: 500 },
    )
  }
}

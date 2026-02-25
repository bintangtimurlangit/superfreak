import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { withApiLogger } from '@/lib/api-logger'

/**
 * Public Blog Posts API
 *
 * Fetch published blog posts with filtering and pagination
 *
 * Query Parameters:
 *   - page: Page number (default: 1)
 *   - limit: Posts per page (default: 10, max: 50)
 *   - category: Filter by category
 *   - search: Search in title and content
 */

export const GET = withApiLogger(async function getBlogPosts(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const payload = await getPayload({ config })

    // Build query
    const where: any = {
      _status: { equals: 'published' },
    }

    if (category) {
      where.categories = { contains: category.toLowerCase() }
    }

    if (search) {
      where.or = [{ title: { contains: search } }, { content: { contains: search } }]
    }

    const result = await payload.find({
      collection: 'blog-posts',
      where,
      limit,
      page,
      sort: '-publishedAt',
      depth: 1, // Populate featuredImage
    })

    // Transform data for frontend
    const posts = result.docs.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      author: post.author,
      date: post.publishedAt || post.createdAt,
      readTime: post.readTime,
      categories: post.categories,
      image: typeof post.featuredImage === 'object' ? post.featuredImage?.url : null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          totalDocs: result.totalDocs,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        },
      },
    })
  } catch (error) {
    console.error('Blog fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch blog posts',
      },
      { status: 500 },
    )
  }
})

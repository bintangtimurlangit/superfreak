import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Get Single Blog Post by Slug
 *
 * GET /api/blog/[slug]
 */

// Helper function to extract text from Lexical content
function extractTextFromLexical(content: any): string {
  if (!content || !content.root || !content.root.children) {
    return ''
  }

  const extractFromNode = (node: any): string => {
    if (node.type === 'text') {
      return node.text || ''
    }

    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractFromNode).join('')
    }

    return ''
  }

  return content.root.children.map(extractFromNode).join('\n\n')
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

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

    // Extract plain text from Lexical content
    const contentText = extractTextFromLexical(post.content)

    return NextResponse.json({
      success: true,
      data: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: contentText,
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

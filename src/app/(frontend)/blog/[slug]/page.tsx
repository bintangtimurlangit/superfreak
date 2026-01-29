import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clock, ArrowLeft, ExternalLink } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  author: string
  date: string
  readTime: string
  categories: string[]
  image?: string
  source?: string
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/blog/${slug}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatCategory = (category: string) => {
  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug)

  if (!post) {
    notFound()
  }

  // Split content into paragraphs
  const paragraphs = post.content.split('\n\n').filter((p) => p.trim())

  return (
    <div className="min-h-screen bg-white">
      {/* Article Content */}
      <article className="mx-auto max-w-5xl px-6 py-12">
        {/* Header Section */}
        <div className="mb-8">
          {/* Categories */}
          <div className="mb-4 flex flex-wrap gap-2">
            {post.categories.map((category) => (
              <span
                key={category}
                className="inline-block px-3 py-1 rounded-full bg-[#1D0DF3] text-white text-xs font-medium"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                {formatCategory(category)}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1
            className="text-[28px] md:text-[36px] lg:text-[40px] font-bold leading-[120%] tracking-[-0.5px] text-[#292929] mb-6"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#656565]">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span style={{ fontFamily: 'var(--font-geist-sans)' }}>{formatDate(post.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span style={{ fontFamily: 'var(--font-geist-sans)' }}>{post.readTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: 'var(--font-geist-sans)' }}>By {post.author}</span>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {post.image && (
          <div className="mb-10 rounded-[20px] overflow-hidden border border-[#EFEFEF] shadow-sm">
            <div className="relative w-full aspect-[16/9]">
              <Image src={post.image} alt={post.title} fill className="object-cover" priority />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="mx-auto max-w-4xl mb-10">
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="text-[16px] md:text-[18px] leading-[180%] text-[#292929] mb-6 text-justify"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Source Link */}
        {post.source && (
          <div className="mb-10 p-6 rounded-[16px] bg-[#F8F8F8] border border-[#EFEFEF]">
            <p
              className="text-sm font-medium text-[#656565] mb-2"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Source:
            </p>
            <a
              href={post.source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#1D0DF3] hover:underline break-all"
              style={{ fontFamily: 'var(--font-geist-mono)' }}
            >
              {post.source}
              <ExternalLink className="h-4 w-4 flex-shrink-0" />
            </a>
          </div>
        )}

        {/* Divider */}
        <div className="my-10 border-t border-[#EFEFEF]"></div>

        {/* Navigation */}
        <div className="flex justify-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-[12px] border border-[#EFEFEF] bg-white text-[#292929] font-medium hover:bg-[#F8F8F8] hover:border-[#DCDCDC] transition-all"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Articles
          </Link>
        </div>
      </article>
    </div>
  )
}

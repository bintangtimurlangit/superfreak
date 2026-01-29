'use client'

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clock, ArrowRight, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import Button from '@/components/ui/Button'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  author: string
  date: string
  readTime: string
  categories: string[]
  image?: string
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Format category for display
const formatCategory = (category: string) => {
  // Handle both hyphenated and single-word categories
  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export default function BlogList() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [allCategories, setAllCategories] = useState<string[]>(['All'])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const postsPerPage = 6

  // Fetch blog posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/blog?limit=100') // Fetch all posts for client-side filtering
        const data = await response.json()

        if (data.success && data.data.posts) {
          setBlogPosts(data.data.posts)

          // Extract unique categories
          const categories = new Set<string>()
          data.data.posts.forEach((post: BlogPost) => {
            post.categories.forEach((cat) => categories.add(cat))
          })
          setAllCategories(['All', ...Array.from(categories)])
        } else {
          setError('Failed to load blog posts')
        }
      } catch (err) {
        console.error('Error fetching blog posts:', err)
        setError('Failed to load blog posts')
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  // Filter posts based on search and category
  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      const matchesSearch =
        searchQuery === '' ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.categories.some((cat) => cat.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory =
        selectedCategory === 'All' || post.categories.includes(selectedCategory)

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory, blogPosts])

  // Reset to page 1 when filters change
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)

  // Reset page if it's out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  const effectivePage = currentPage > totalPages && totalPages > 0 ? 1 : currentPage
  const startIndex = (effectivePage - 1) * postsPerPage
  const endIndex = startIndex + postsPerPage
  const currentPosts = filteredPosts.slice(startIndex, endIndex)

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setCurrentPage(1)
  }

  return (
    <section className="bg-[#F8F8F8] py-12 md:py-16 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2
            className="text-[24px] sm:text-[28px] md:text-[32px] font-normal leading-[100%] tracking-[-0.5px] text-[#292929]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            <span className="font-semibold text-[#1D0DF3]" style={{ fontWeight: 600 }}>
              Articles & News
            </span>
          </h2>
          <div className="h-2"></div>
          <p
            className="text-[14px] sm:text-[16px] font-normal leading-[100%] tracking-[0px] text-[#7C7C7C]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Stay updated with the latest insights, tips, and trends in 3D printing.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#656565]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-12 pr-10 py-3 rounded-[12px] border border-[#EFEFEF] bg-white text-[#292929] text-sm placeholder:text-[#9CA3AF] placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent transition-all"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#656565] hover:text-[#292929] transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-[#1D0DF3] text-white'
                    : 'bg-white text-[#292929] border border-[#EFEFEF] hover:border-[#DCDCDC] hover:bg-[#F8F8F8]'
                }`}
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                {formatCategory(category)}
              </button>
            ))}
          </div>

          {/* Results Count */}
          {filteredPosts.length !== blogPosts.length && (
            <div className="text-center">
              <p
                className="text-sm text-[#7C7C7C]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Found {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Blog Posts Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p
              className="text-base text-[#7C7C7C]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Loading articles...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p
              className="text-base text-[#FF0000]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              {error}
            </p>
          </div>
        ) : currentPosts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {currentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-[20px] border border-[#EFEFEF] overflow-hidden hover:border-[#DCDCDC] hover:shadow-lg transition-all duration-200"
              >
                {/* Image */}
                {post.image ? (
                  <div className="w-full h-48 relative overflow-hidden">
                    <Image src={post.image} alt={post.title} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-[#F8F8F8] to-[#EFEFEF] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Category Badges */}
                  <div className="mb-3 flex flex-wrap gap-2">
                    {post.categories.slice(0, 2).map((category) => (
                      <span
                        key={category}
                        className="inline-block px-3 py-1 rounded-full bg-[#1D0DF3] text-white text-xs font-medium"
                        style={{ fontFamily: 'var(--font-geist-mono)' }}
                      >
                        {formatCategory(category)}
                      </span>
                    ))}
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 mb-3 text-xs text-[#656565]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span style={{ fontFamily: 'var(--font-geist-sans)' }}>
                        {formatDate(post.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span style={{ fontFamily: 'var(--font-geist-sans)' }}>{post.readTime}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    className="text-[18px] md:text-[20px] font-semibold text-[#292929] mb-2 line-clamp-2 group-hover:text-[#1D0DF3] transition-colors"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p
                    className="text-[14px] text-[#656565] mb-4 line-clamp-3 leading-relaxed"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    {post.excerpt}
                  </p>

                  {/* Author & Read More */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#EFEFEF]">
                    <span
                      className="text-xs text-[#7C7C7C]"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      By {post.author}
                    </span>
                    <div className="flex items-center gap-1 text-[#1D0DF3] group-hover:gap-2 transition-all">
                      <span
                        className="text-sm font-medium"
                        style={{ fontFamily: 'var(--font-geist-mono)' }}
                      >
                        Read more
                      </span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6">
            {/* Empty State Icon */}
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1D0DF3]/10 to-[#1D0DF3]/5 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-[#1D0DF3]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
            </div>

            {/* Empty State Text */}
            <h3
              className="text-[20px] md:text-[24px] font-semibold text-[#292929] mb-3"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              {searchQuery || selectedCategory !== 'All' ? 'No articles found' : 'No articles yet'}
            </h3>
            <p
              className="text-[14px] md:text-[16px] text-[#7C7C7C] mb-6 max-w-md mx-auto"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              {searchQuery || selectedCategory !== 'All'
                ? "Try adjusting your search terms or filters to find what you're looking for."
                : "Stay tuned! We'll be publishing articles about 3D printing, materials, design tips, and industry news soon."}
            </p>

            {/* Action Button */}
            {(searchQuery || selectedCategory !== 'All') && (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('All')
                  setCurrentPage(1)
                }}
                className="mx-auto"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-10 w-10 p-0"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={`h-10 min-w-10 ${
                  currentPage === page
                    ? '!bg-[#1D0DF3] !text-white hover:!bg-[#1a0bd4] !border-[#1D0DF3]'
                    : ''
                }`}
              >
                {page}
              </Button>
            ))}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-10 w-10 p-0"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

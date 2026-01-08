'use client'

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clock, ArrowRight, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import Button from '@/components/ui/Button'

interface BlogPost {
  id: number
  title: string
  excerpt: string
  author: string
  date: string
  readTime: string
  category: string
  image?: string
}

const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: 'Understanding PLA vs PETG: Which Material is Right for Your Project?',
    excerpt:
      'Explore the key differences between PLA and PETG materials, their strengths, weaknesses, and ideal use cases for your 3D printing projects.',
    author: 'Superfreak Team',
    date: '2025-01-08',
    readTime: '5 min read',
    category: 'Materials',
  },
  {
    id: 2,
    title: 'Top 5 Design Tips for Better 3D Printing Results',
    excerpt:
      'Learn essential design principles that will help you create models that print successfully every time, with fewer supports and better surface quality.',
    author: 'Superfreak Team',
    date: '2025-01-05',
    readTime: '7 min read',
    category: 'Design',
  },
  {
    id: 3,
    title: 'The Future of 3D Printing: Trends to Watch in 2025',
    excerpt:
      'Discover the latest trends and innovations shaping the 3D printing industry, from new materials to advanced manufacturing techniques.',
    author: 'Superfreak Team',
    date: '2025-01-02',
    readTime: '6 min read',
    category: 'Industry News',
  },
  {
    id: 4,
    title: 'Post-Processing Techniques for Professional 3D Prints',
    excerpt:
      'Master the art of post-processing to transform your raw prints into professional-quality products with sanding, painting, and finishing techniques.',
    author: 'Superfreak Team',
    date: '2024-12-28',
    readTime: '8 min read',
    category: 'Tutorials',
  },
  {
    id: 5,
    title: 'How to Optimize Your 3D Models for Cost-Effective Printing',
    excerpt:
      'Practical tips and tricks to reduce material usage and printing time while maintaining quality, helping you save on your next project.',
    author: 'Superfreak Team',
    date: '2024-12-25',
    readTime: '5 min read',
    category: 'Tips & Tricks',
  },
  {
    id: 6,
    title: '3D Printing for Small Businesses: A Complete Guide',
    excerpt:
      'Learn how small businesses can leverage 3D printing for prototyping, custom products, and rapid iteration to stay competitive.',
    author: 'Superfreak Team',
    date: '2024-12-22',
    readTime: '10 min read',
    category: 'Business',
  },
]

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const allCategories = ['All', ...Array.from(new Set(blogPosts.map((post) => post.category)))]

export default function BlogList() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const postsPerPage = 6

  // Filter posts based on search and category
  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      const matchesSearch =
        searchQuery === '' ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.category.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

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
                {category}
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
        {currentPosts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {currentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.id}`}
                className="group bg-white rounded-[20px] border border-[#EFEFEF] overflow-hidden hover:border-[#DCDCDC] hover:shadow-lg transition-all duration-200"
              >
                {/* Image Placeholder */}
                <div className="w-full h-48 bg-gradient-to-br from-[#F8F8F8] to-[#EFEFEF] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Category Badge */}
                  <div className="mb-3">
                    <span
                      className="inline-block px-3 py-1 rounded-full bg-[#1D0DF3] text-white text-xs font-medium"
                      style={{ fontFamily: 'var(--font-geist-mono)' }}
                    >
                      {post.category}
                    </span>
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
          <div className="text-center py-12">
            <p
              className="text-base text-[#7C7C7C]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              No articles found. Try adjusting your search or filters.
            </p>
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

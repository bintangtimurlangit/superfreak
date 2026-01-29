import Link from 'next/link'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1D0DF3]/10 to-[#1D0DF3]/5 flex items-center justify-center">
            <FileQuestion className="w-10 h-10 text-[#1D0DF3]" />
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-[32px] md:text-[40px] font-bold leading-[110%] text-[#292929] mb-4"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          Article Not Found
        </h1>

        {/* Description */}
        <p
          className="text-[16px] text-[#7C7C7C] mb-8"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          The article you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>

        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-[12px] bg-[#1D0DF3] text-white font-medium hover:bg-[#1A0DF0] transition-colors"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Articles
        </Link>
      </div>
    </div>
  )
}

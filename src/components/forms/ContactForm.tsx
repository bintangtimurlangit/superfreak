'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, ChevronDown } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false)
  const subjectDropdownRef = useRef<HTMLDivElement>(null)

  const subjects = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'quote', label: 'Request a Quote' },
    { value: 'project', label: 'Project Discussion' },
    { value: 'support', label: 'Technical Support' },
    { value: 'collaboration', label: 'Collaboration' },
    { value: 'materials', label: 'Request Materials' },
    { value: 'other', label: 'Other' },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        subjectDropdownRef.current &&
        !subjectDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSubjectDropdownOpen(false)
      }
    }

    if (isSubjectDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSubjectDropdownOpen])

  const handleSubjectSelect = (value: string) => {
    setFormData({ ...formData, subject: value })
    setIsSubjectDropdownOpen(false)
  }

  const selectedSubjectLabel =
    subjects.find((s) => s.value === formData.subject)?.label || 'Select a subject'

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // TODO: Implement form submission logic
    setTimeout(() => {
      setIsSubmitting(false)
      alert('Thank you for your message! We will get back to you soon.')
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    }, 1000)
  }

  return (
    <section className="bg-[#F8F8F8] py-12 md:py-16 px-6 md:px-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 mt-12 sm:mb-12">
          <h2
            className="text-[24px] sm:text-[28px] md:text-[32px] font-normal leading-[100%] tracking-[-0.5px] text-[#292929]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Get in{' '}
            <span className="font-semibold text-[#1D0DF3]" style={{ fontWeight: 600 }}>
              Touch
            </span>
          </h2>
          <div className="h-2"></div>
          <p
            className="text-[14px] sm:text-[16px] font-normal leading-[100%] tracking-[0px] text-[#7C7C7C]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Have a question or want to discuss your project? We&apos;re here to help.
          </p>
        </div>

        {/* Contact Form Card */}
        <div className="bg-gray-100 p-0.5 rounded-2xl shadow-lg border border-[#EFEFEF] overflow-hidden mb-8">
          <div className="bg-white rounded-2xl overflow-hidden p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name and Email Row */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-[#292929] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-[12px] border border-[#EFEFEF] bg-white text-[#292929] text-sm placeholder:text-[#9CA3AF] placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent transition-all"
                    placeholder="Your name"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[#292929] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-[12px] border border-[#EFEFEF] bg-white text-[#292929] text-sm placeholder:text-[#9CA3AF] placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent transition-all"
                    placeholder="your.email@example.com"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  />
                </div>
              </div>

              {/* Phone and Subject Row */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-[#292929] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-[12px] border border-[#EFEFEF] bg-white text-[#292929] text-sm placeholder:text-[#9CA3AF] placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent transition-all"
                    placeholder="+62 812-3456-7890"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-[#292929] mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Subject *
                  </label>
                  <div className="relative" ref={subjectDropdownRef}>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full !justify-between text-sm px-4 h-[48px] !py-0 items-center"
                      onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                    >
                      <span
                        className={`flex-1 text-left ${formData.subject ? '' : 'text-[#9CA3AF]'}`}
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        {selectedSubjectLabel}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          isSubjectDropdownOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden
                      />
                    </Button>
                    {isSubjectDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-black border border-[#EFEFEF] dark:border-white/10 rounded-lg shadow-lg z-50">
                        {subjects.map((subject) => (
                          <button
                            key={subject.value}
                            type="button"
                            onClick={() => handleSubjectSelect(subject.value)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f5f5f5] dark:hover:bg-white/10 transition-colors ${
                              formData.subject === subject.value
                                ? 'bg-[#f5f5f5] dark:bg-white/10 font-medium'
                                : 'text-[#292929] dark:text-foreground'
                            }`}
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            {subject.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input type="hidden" name="subject" value={formData.subject} required />
                </div>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-[#292929] mb-2"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-[12px] border border-[#EFEFEF] bg-white text-[#292929] text-sm placeholder:text-[#9CA3AF] placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent transition-all resize-none"
                  placeholder="Tell us about your project or question..."
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 px-6 gap-2 rounded-[12px] border border-[#292929] !bg-[#292929] text-white hover:!bg-[#333333] shadow-[inset_0_0_0_2px_rgba(126,126,126,0.25)] text-sm font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin border-2 border-r-transparent rounded-full"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" aria-hidden />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

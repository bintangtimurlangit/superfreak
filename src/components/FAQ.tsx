'use client'

import { useState } from 'react'

const faqData = [
  {
    id: 1,
    question: 'What services does Superfreak Studio provide?',
    answer:
      'We specialize in 3D printing with high precision, offering materials like PLA and PETG. Beyond printing, we also support product design consultations and help source additional parts such as LEDs, fittings, and cables — so your ideas can become complete, functional products.',
  },
  {
    id: 2,
    question: 'How does pricing work?',
    answer:
      'Our pricing is based on material usage, complexity, and finishing options. We provide transparent, upfront quotes with no hidden fees. Simply upload your model for an instant estimate.',
  },
  {
    id: 3,
    question: 'What materials do you offer for 3D printing?',
    answer:
      'We offer PLA and PETG materials in various colors. Both materials are high-quality and suitable for different applications.',
  },
  {
    id: 4,
    question: 'Can you help me if I only have an idea, not a finished model?',
    answer:
      'Absolutely! We offer design consultations and can help turn your ideas into printable models. Our team assists with 3D modeling, optimization, and technical feasibility.',
  },
  {
    id: 5,
    question: 'How long does it take to receive my order?',
    answer:
      'Standard turnaround is 3-7 business days for most projects. Rush orders can be expedited to 2-3 days. We&apos;ll provide an accurate timeline after reviewing your model.',
  },
]

export default function FAQ() {
  const [openId, setOpenId] = useState<number | null>(null)

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <section className="bg-[#F8F8F8] py-12 md:py-16 px-6 md:px-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2
            className="text-[24px] sm:text-[28px] md:text-[32px] font-normal leading-[100%] tracking-[-0.5px] text-[#292929]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Got Questions?{' '}
            <span className="font-semibold text-[#1D0DF3]" style={{ fontWeight: 600 }}>
              We&apos;ve Got Answers
            </span>
          </h2>
          <div className="h-2"></div>
          <p
            className="text-[14px] sm:text-[16px] font-normal leading-[100%] tracking-[0px] text-[#7C7C7C]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Everything about printing, pricing, and projects.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-gray-100 p-0.5 rounded-2xl shadow-lg border border-[#EFEFEF] overflow-hidden">
          <div className="bg-white rounded-2xl overflow-hidden p-2">
            {faqData.map((faq) => (
              <div key={faq.id}>
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className={`w-full cursor-pointer px-4 md:px-6 py-4 md:py-5 text-left flex items-center justify-between transition-colors ${
                    openId === faq.id ? 'bg-gray-100 rounded-t-2xl' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <span className="font-semibold text-[#292929] pr-4">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-[#7C7C7C] transition-transform duration-300 flex-shrink-0 ${
                      openId === faq.id ? 'rotate-180' : 'rotate-0'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Answer */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openId === faq.id
                      ? 'max-h-[500px] opacity-100 bg-gray-100 rounded-b-2xl'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-4 md:px-6 pb-4 md:pb-5 text-sm md:text-base text-[#656565]">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="px-6 py-8 bg-gray-100 border-t border-[#EFEFEF] rounded-b-2xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-[#1D0DF3] text-base md:text-lg font-semibold">
                  Have a question?
                </h3>
                <p className="text-[#656565] text-sm md:text-base">Fast, friendly answers</p>
              </div>
              <a
                href="/contact"
                className="flex items-center text-sm md:text-base gap-2 bg-[#1D0DF3] hover:bg-[#1a0bd4] text-white px-4 md:px-6 py-3 md:py-2 rounded-[12px] font-medium transition-colors shadow-sm"
              >
                Contact Us
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

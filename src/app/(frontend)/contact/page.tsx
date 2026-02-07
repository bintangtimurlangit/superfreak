import React, { Suspense } from 'react'
import ContactForm from '@/components/forms/ContactForm'

export default async function ContactPage() {
  return (
    <div className="bg-white">
      <Suspense fallback={<div className="min-h-screen animate-pulse bg-[#F8F8F8]" />}>
        <ContactForm />
      </Suspense>
    </div>
  )
}

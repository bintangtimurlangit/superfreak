import React from 'react'
import HeroUpload from '@/components/HeroUpload'
import Features from '@/components/Features'
import SeamlessProcess from '@/components/SeamlessProcess'
import MaterialSelection from '@/components/MaterialSelection'
import SuperfreakOriginal from '@/components/SuperfreakOriginal'
import FAQ from '@/components/FAQ'

export default async function HomePage() {
  return (
    <div>
      <HeroUpload />
      <Features />
      <SeamlessProcess />
      <MaterialSelection />
      <SuperfreakOriginal />
      <FAQ />
    </div>
  )
}

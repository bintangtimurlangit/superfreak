import React from 'react'
import HeroUpload from '@/components/sections/HeroUpload'
import Features from '@/components/sections/Features'
import SeamlessProcess from '@/components/sections/SeamlessProcess'
import MaterialSelection from '@/components/sections/MaterialSelection'
import SuperfreakOriginal from '@/components/sections/SuperfreakOriginal'
import FAQ from '@/components/sections/FAQ'

export default async function HomePage() {
  return (
    <div>
      <HeroUpload />
      <Features />
      <SeamlessProcess />
      <MaterialSelection />
      <div className="bg-[#F8F8F8]">
        <SuperfreakOriginal />
        <FAQ />
      </div>
    </div>
  )
}

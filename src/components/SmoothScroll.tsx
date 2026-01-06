'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import 'lenis/dist/lenis.css'

// Export lenis instance so other components can control it
export const lenisInstance = { current: null as Lenis | null }

export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
    })
    lenisInstance.current = lenis

    // Connect Lenis to ScrollTrigger globally
    lenis.on('scroll', ScrollTrigger.update)

    return () => {
      lenis.off('scroll', ScrollTrigger.update)
      lenis.destroy()
      lenisInstance.current = null
    }
  }, [])

  return null
}

'use client'

import { Upload, Layers, ShoppingBag, ShieldCheck, Box } from 'lucide-react'
import Image from 'next/image'
import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { lenisInstance } from '@/components/layout/SmoothScroll'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function SeamlessProcess() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardsContainerRef = useRef<HTMLDivElement>(null)
  const card1Ref = useRef<HTMLDivElement>(null)
  const card2Ref = useRef<HTMLDivElement>(null)
  const card3Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current || !card1Ref.current || !card2Ref.current || !card3Ref.current) return

    const setupScrollTrigger = () => {
      if (!lenisInstance.current) {
        setTimeout(setupScrollTrigger, 100)
        return
      }

      gsap.set([card1Ref.current, card2Ref.current, card3Ref.current], {
        opacity: 0,
        y: 50,
      })

      const navbar = document.querySelector('header')
      const navbarHeight = navbar ? navbar.offsetHeight : 80

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: `top-=${navbarHeight} top`,
          end: '+=200%',
          pin: true,
          pinSpacing: true,
          scrub: 1,
          invalidateOnRefresh: true,
          markers: false,
        },
      })

      const setPinSpacerBg = () => {
        const pinSpacer = document.querySelector('.pin-spacer') as HTMLElement
        if (pinSpacer) {
          pinSpacer.style.backgroundColor = '#F8F8F8'
        } else {
          setTimeout(setPinSpacerBg, 50)
        }
      }
      setPinSpacerBg()

      tl.to(card1Ref.current, {
        opacity: 1,
        y: 0,
        duration: 0.33,
        ease: 'power2.out',
      })
        .to(
          card2Ref.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.33,
            ease: 'power2.out',
          },
          '-=0.1',
        )
        .to(
          card3Ref.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.34,
            ease: 'power2.out',
          },
          '-=0.1',
        )
    }

    setupScrollTrigger()

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      if (lenisInstance.current) {
        lenisInstance.current.off('scroll', ScrollTrigger.update)
      }
    }
  }, [])
  return (
    <section
      ref={sectionRef}
      className="py-12 md:py-16 px-6 md:px-10 bg-[#F8F8F8] scroll-mt-20"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2
            className="text-[24px] sm:text-[28px] md:text-[32px] font-normal leading-[100%] tracking-[-0.5px] text-[#292929]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Our{' '}
            <span className="font-semibold text-[#1D0DF3]" style={{ fontWeight: 600 }}>
              Seamless
            </span>{' '}
            Process
          </h2>
          <div className="h-2"></div>
          <p
            className="text-[14px] sm:text-[16px] font-normal leading-[100%] tracking-[0px] text-[#7C7C7C]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Get your design printed without the hassle.
          </p>
        </div>

        {/* Process Cards */}
        <div ref={cardsContainerRef} className="grid lg:grid-cols-3 gap-8">
          {/* Card 1: Upload Your Model */}
          <div ref={card1Ref} className="flex flex-col">
            <div className="mb-2 text-center">
              <span
                className="text-[48px] md:text-[56px] font-light leading-none tracking-tight bg-gradient-to-b from-[#A0A0A0] to-[#F8F8F8] bg-clip-text text-transparent"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                step-1
              </span>
            </div>
            <div className="bg-white rounded-[16px] border border-[#EFEFEF] p-6 shadow-sm flex flex-col relative flex-1">
              {/* Security Notice */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-[#656565]" />
                <span className="text-[12px] text-[#656565]">
                  Your files are securely stored and kept private
                </span>
              </div>

              {/* Upload Area and File Preview Container */}
              <div className="relative group mb-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-[#DCDCDC] rounded-[12px] px-8 pb-10 pt-8 text-center select-none">
                  <div
                    className="w-12 h-12 bg-white border border-[#DCDCDC] rounded-[8px] flex items-center justify-center mx-auto mb-4 group-hover:opacity-30 transition-opacity duration-200"
                    style={{
                      boxShadow: '0px 2px 10px 0px rgba(152, 152, 152, 0.05)',
                    }}
                  >
                    <Box className="h-6 w-6 text-[#656565]" />
                  </div>
                  <p className="text-[14px] font-medium text-[#292929] mb-1 group-hover:opacity-30 transition-opacity duration-200">
                    Upload 3D Models
                  </p>
                  <p className="text-[12px] text-[#666666] group-hover:opacity-30 transition-opacity duration-200">
                    Supported formats: .stl, .obj, .step, .stp, .x_t, .iges, .igs, .sldprt, .zip
                    (Max: 500 MB per file)
                  </p>
                </div>

                {/* File Preview - Below upload area by default, absolute when upload area is hovered */}
                <div className="mt-2 bg-[#F8F8F8] rounded-[8px] p-3 flex items-center gap-3 transform rotate-0 transition-all duration-200 cursor-grab active:cursor-grabbing shadow-lg group-hover:absolute group-hover:top-52 group-hover:left-0 group-hover:-translate-y-10 group-hover:-rotate-4 group-hover:mb-0 group-hover:z-10 w-full group-hover:w-80 hover:!transform hover:!rotate-0 hover:!translate-y-0 select-none">
                  <div className="mt-2 w-12 h-12 bg-white rounded border overflow-hidden flex items-center justify-center">
                    <Image
                      src="/superfreak-studio-ridged.png"
                      alt="WhiteLamp3D.obj"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[13px] font-medium text-[#292929]">Lamp3D.obj</p>
                      <span className="bg-[#E5E5E5] text-[#666666] text-[10px] px-2 py-1 rounded-full">
                        100 MB
                      </span>
                    </div>
                    <p className="text-[11px] text-[#666666]">12 x 8 x 20 cm - (80 g)</p>
                  </div>
                  {/* Grabbing Hand Icon */}
                  <div className="absolute -top-3 left-16 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Image
                      src="/superfreak-studio-grab.png"
                      alt="Grab hand"
                      width={24}
                      height={24}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Header - Moved to absolute bottom */}
              <div className="flex flex-col items-start gap-3 mt-auto">
                <div className="w-8 h-8 min-w-8 min-h-8 bg-[#1D0DF3] rounded-lg flex items-center justify-center">
                  <Upload className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-[16px] md:text-[18px] font-semibold text-[#292929]">
                    Upload Your Model
                  </h3>
                  <p className="text-[14px] text-[#666666]">
                    Drag & drop or browse to upload your 3D file
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Select Options */}
          <div ref={card2Ref} className="flex flex-col">
            <div className="mb-2 text-center">
              <span
                className="text-[48px] md:text-[56px] font-light leading-none tracking-tight bg-gradient-to-b from-[#A0A0A0] to-[#F8F8F8] bg-clip-text text-transparent"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                step-2
              </span>
            </div>
            <div className="bg-white rounded-[16px] border border-[#EFEFEF] p-6 shadow-sm flex flex-col flex-1">
              {/* Option Selection */}
              <div className="space-y-3 flex-1 mb-6">
                {/* Selected Option */}
                <div className="border-2 border-black bg-white rounded-[8px] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#F8F8F8] rounded-lg flex items-center justify-center">
                        <span className="text-[16px] font-semibold text-[#292929]">0.12</span>
                      </div>
                      <div>
                        <div className="text-[14px] font-medium text-[#292929]">Rp. 800</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-[#292929] text-white text-[10px] px-2 py-1 rounded">
                            Fine Quality
                          </span>
                          <span className="flex items-center gap-1 text-[12px] text-[#666666]">
                            Best for detailed models
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-4 h-4 border-2 border-black rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-black rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Other Options (Placeholder) */}
                <div className="border border-[#EFEFEF] rounded-[8px] p-4 opacity-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                  </div>
                </div>
                <div className="border border-[#EFEFEF] rounded-[8px] p-4 opacity-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Header - Moved to bottom */}
              <div className="flex flex-col items-start gap-3">
                <div className="w-8 h-8 min-w-8 min-h-8 bg-[#1D0DF3] rounded-lg flex items-center justify-center">
                  <Layers className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-[16px] md:text-[18px] font-semibold text-[#292929]">
                    Select Options
                  </h3>
                  <p className="text-[14px] text-[#666666]">Customize Color, Material & Layers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Review, Pay, Done */}
          <div ref={card3Ref} className="flex flex-col">
            <div className="mb-2 text-center">
              <span
                className="text-[48px] md:text-[56px] font-light leading-none tracking-tight bg-gradient-to-b from-[#A0A0A0] to-[#F8F8F8] bg-clip-text text-transparent"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                step-3
              </span>
            </div>
            <div className="bg-white rounded-[16px] border border-[#EFEFEF] p-6 shadow-sm flex flex-col flex-1">
              {/* Options Summary */}
              <div className="mb-6">
                <h4 className="text-[14px] font-medium text-[#292929] mb-3">Options</h4>
                <div className="flex items-center gap-2 text-[13px] text-[#666666]">
                  <span>PLA</span>
                  <span>•</span>
                  <span>0.12</span>
                  <div className="w-4 h-4 bg-[#292929] rounded border"></div>
                  <span>Charcoal Black</span>
                </div>
              </div>

              {/* All Models Summary */}
              <div className="mb-6">
                <h4 className="text-[14px] font-medium text-[#292929] mb-3">All Models (3)</h4>
                <div className="space-y-2 text-[13px] text-[#666666]">
                  <div className="flex justify-between">
                    <span>Total Amount</span>
                    <span>20 pcs.</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Weight</span>
                    <span>180 g.</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Print Time</span>
                    <span>12 hours</span>
                  </div>
                </div>
              </div>

              {/* Individual Model */}
              <div className="bg-[#F8F8F8] rounded-[8px] p-3 mb-6 flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-white rounded border flex items-center justify-center"></div>
                  <div className="flex-1">
                    <p className="text-[12px] font-medium text-[#292929]">WhiteLamp3D.obj</p>
                    <p className="text-[10px] text-[#666666]">100 MB • 12 x 8 x 20 cm</p>
                  </div>
                </div>
                <div className="flex justify-between text-[11px] text-[#666666]">
                  <span>10 pcs</span>
                  <span>100 g</span>
                  <span>12 hours</span>
                </div>
              </div>

              {/* Header - Moved to bottom */}
              <div className="flex flex-col items-start gap-3">
                <div className="w-8 h-8 min-w-8 min-h-8 bg-[#1D0DF3] rounded-lg flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-[16px] md:text-[18px] font-semibold text-[#292929]">
                    Review, Pay, Done
                  </h3>
                  <p className="text-[14px] text-[#666666]">
                    Review the cost, complete payment, and relax while we print it
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

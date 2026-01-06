'use client'

import { Target, Sliders, DollarSign } from 'lucide-react'
import Button from './Button'
import Image from 'next/image'

export default function Features() {
  return (
    <section className="relative overflow-hidden">
      {/* Blue gradient background */}
      <div className="bg-gradient-to-b from-45% from-[#1D0DF3] to-65% to-[#F8F8F8] py-12 md:py-16 px-6 md:px-10">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-10">
            <div className="mb-6 lg:mb-0">
              <h2 className="text-[28px] font-normal leading-[100%] tracking-[-0.5px] text-white mb-2 md:mb-4">
                Print with <span className="font-bold">Confidence</span>
              </h2>
              <p className="text-[14px] font-normal leading-[100%] tracking-[0px] text-[#EFEFEF] max-w-2xl">
                High-detail prints with flexible options and upfront costs.
              </p>
            </div>
            <Button
              variant="secondary"
              className="h-9 md:h-11 px-3 md:px-4 gap-2 rounded-[12px] border border-[#EFEFEF] bg-[#FCFCFC] text-[#1A1798] hover:bg-[#f7f7f7] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25)] text-[12px] md:text-[14px] font-medium leading-[100%] tracking-[0px]"
            >
              Prove it Now!
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-16 md:mb-20">
            <div className="bg-[#3B41FF] rounded-[20px] border-2 border-[#6072FF] p-6 text-white flex flex-col gap-6 md:gap-9">
              <div className="w-12 h-12 md:w-[52px] md:h-[52px] bg-white border border-[#EFEFEF] rounded-[12px] p-3 flex items-center justify-center shadow-[-4px_4px_20px_0_rgba(29,13,242,0.25)]">
                <Target className="h-5 w-5 text-[#1D0DF3]" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-[18px] md:text-[20px] font-semibold leading-[100%] text-white">
                  High Precision Results
                </h3>
                <p className="text-[12px] md:text-[14px] font-normal leading-[100%] text-[#EFEFEF]">
                  Your design, printed with exceptional detail.
                </p>
              </div>
            </div>

            <div className="bg-[#3B41FF] rounded-[20px] border-2 border-[#6072FF] p-6 text-white flex flex-col gap-6 md:gap-9">
              <div className="w-12 h-12 md:w-[52px] md:h-[52px] bg-white border border-[#EFEFEF] rounded-[12px] p-3 flex items-center justify-center shadow-[-4px_4px_20px_0_rgba(29,13,242,0.25)]">
                <Sliders className="h-5 w-5 text-[#1D0DF3]" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-[18px] md:text-[20px] font-semibold leading-[100%] text-white">
                  Full Control
                </h3>
                <p className="text-[12px] md:text-[14px] font-normal leading-[100%] text-[#EFEFEF]">
                  You decide materials, size, and finish.
                </p>
              </div>
            </div>

            <div className="bg-[#3B41FF] rounded-[20px] border-2 border-[#6072FF] p-6 text-white flex flex-col gap-6 md:gap-9">
              <div className="w-12 h-12 md:w-[52px] md:h-[52px] bg-white border border-[#EFEFEF] rounded-[12px] p-3 flex items-center justify-center shadow-[-4px_4px_20px_0_rgba(29,13,242,0.25)]">
                <DollarSign className="h-5 w-5 text-[#1D0DF3]" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-[18px] md:text-[20px] font-semibold leading-[100%] text-white">
                  Transparent Pricing
                </h3>
                <p className="text-[12px] md:text-[14px] font-normal leading-[100%] text-[#EFEFEF]">
                  No hidden costs, clear estimates.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-stretch p-4 sm:p-6 lg:p-8 bg-white rounded-[20px] border border-[#EFEFEF] min-h-[400px] lg:h-[500px]">
            {/* Left side - 3D Printed Objects Image with Text Below */}
            <div className="flex flex-col w-full lg:w-[55%]">
              <div className="relative rounded-2xl overflow-hidden w-full h-[300px] sm:h-[350px] md:h-[380px] lg:h-[320px] mb-6">
                <Image
                  src="/superfreak-studio-result.png"
                  alt="3D Printed Objects - Superfreak Studio Results"
                  width={600}
                  height={450}
                  className="w-full h-full object-cover object-center"
                  priority
                />
              </div>
              {/* Text Content Below Image */}
              <div className="flex flex-col">
                <p className="text-[18px] sm:text-[22px] lg:text-[26px] font-normal leading-[100%] tracking-[-0.5px] text-[#1D0DF3] mb-3">
                  <span className="text-[#1D0DF3]">Trusted by Makers</span>,{' '}
                  <span className="font-bold text-[#1D0DF3]">Backed by Results</span>
                </p>
                <p className="text-[12px] sm:text-[13px] lg:text-[14px] font-normal leading-[140%] tracking-[0px] text-[#7C7C7C] font-sans">
                  We&apos;re not just a 3D printing service—we&apos;re your creative partner. From
                  precision to pricing, Superfreak Studio is built to support your vision at every
                  step.
                </p>
              </div>
            </div>

            {/* Separator - Hidden on mobile/tablet, visible on desktop */}
            <div
              className="hidden lg:block w-0 h-full border-l-2 border-[#DCDCDC]"
              style={{
                borderImage:
                  'repeating-linear-gradient(to bottom, #DCDCDC 0px, #DCDCDC 8px, transparent 8px, transparent 12px) 1',
              }}
            />

            {/* Right side - Statistics */}
            <div className="w-full lg:w-[40%] flex items-center justify-center lg:justify-start lg:pl-4">
              {/* Statistics */}
              <div className="flex flex-col gap-10 sm:gap-12 lg:gap-14 w-full">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between md:flex-row md:justify-start md:items-center gap-2 sm:gap-4 mb-2 md:mb-3">
                    <div
                      className="text-[24px] sm:text-[28px] lg:text-[32px] font-normal leading-[100%] tracking-[0px] text-[#292929] sm:flex-shrink-0"
                      style={{ fontFamily: 'var(--font-geist-mono)' }}
                    >
                      100+
                    </div>
                    <div className="bg-[#E9EFFF] border border-[#B8C9FF] text-[#1D0DF3] px-3 py-1.5 rounded-[10px] text-[12px] sm:text-[13px] lg:text-[14px] font-medium leading-[100%] tracking-[0px] font-sans sm:flex-1 sm:text-right md:flex-none md:text-left">
                      3D Models Printed
                    </div>
                  </div>
                  <p className="text-[12px] sm:text-[13px] lg:text-[14px] font-normal leading-[140%] tracking-[0px] text-[#7C7C7C] font-sans">
                    Designs turned into real-world objects with precision.
                  </p>
                </div>

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between md:flex-row md:justify-start md:items-center gap-2 sm:gap-4 mb-2 md:mb-3">
                    <div
                      className="text-[24px] sm:text-[28px] lg:text-[32px] font-normal leading-[100%] tracking-[0px] text-[#292929] sm:flex-shrink-0"
                      style={{ fontFamily: 'var(--font-geist-mono)' }}
                    >
                      98%
                    </div>
                    <div className="bg-[#E9EFFF] border border-[#B8C9FF] text-[#1D0DF3] px-3 py-1.5 rounded-[10px] text-[12px] sm:text-[13px] lg:text-[14px] font-medium leading-[100%] tracking-[0px] font-sans sm:flex-1 sm:text-right md:flex-none md:text-left">
                      Customer Satisfaction
                    </div>
                  </div>
                  <p className="text-[12px] sm:text-[13px] lg:text-[14px] font-normal leading-[140%] tracking-[0px] text-[#7C7C7C] font-sans">
                    Based on post-order feedback and repeat users.
                  </p>
                </div>

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between md:flex-row md:justify-start md:items-center gap-2 sm:gap-4 mb-2 md:mb-3">
                    <div
                      className="text-[24px] sm:text-[28px] lg:text-[32px] font-normal leading-[100%] tracking-[0px] text-[#292929] sm:flex-shrink-0"
                      style={{ fontFamily: 'var(--font-geist-mono)' }}
                    >
                      1:1
                    </div>
                    <div className="bg-[#E9EFFF] border border-[#B8C9FF] text-[#1D0DF3] px-3 py-1.5 rounded-[10px] text-[12px] sm:text-[13px] lg:text-[14px] font-medium leading-[100%] tracking-[0px] font-sans sm:flex-1 sm:text-right md:flex-none md:text-left">
                      Model Support
                    </div>
                  </div>
                  <p className="text-[12px] sm:text-[13px] lg:text-[14px] font-normal leading-[140%] tracking-[0px] text-[#7C7C7C] font-sans">
                    Our team reviews and optimizes each file before print.
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

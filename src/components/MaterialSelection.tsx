'use client'

import { Puzzle, Wrench, Shield, Sun, Waves, Layers } from 'lucide-react'
import Image from 'next/image'
import Button from './Button'

export default function MaterialSelection() {
  return (
    <section className="py-12 md:py-16 px-6 md:px-10 bg-[#F8F8F8]">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2
            className="text-[24px] sm:text-[28px] md:text-[32px] font-normal leading-[100%] tracking-[-0.5px] text-[#292929]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Pick What{' '}
            <span className="font-semibold text-[#1D0DF3]" style={{ fontWeight: 600 }}>
              Fits Best
            </span>
          </h2>
          <div className="h-2"></div>
          <p
            className="text-[14px] sm:text-[16px] font-normal leading-[100%] tracking-[0px] text-[#7C7C7C]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Different materials, colors, and finishes for every idea.
          </p>
        </div>

        {/* Material Cards */}
        <div className="grid md:grid-cols-2 gap-5 mb-12">
          {/* PLA Card */}
          <div
            className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 min-w-0 overflow-hidden"
            style={{
              boxShadow: '0 4px 20px rgba(119, 119, 119, 0.05)',
            }}
          >
            {/* Content */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
              {/* Top Section */}
              <div>
                <h3
                  className="text-[20px] sm:text-[24px] font-semibold text-[#292929] leading-[100%] tracking-[-0.5px]"
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  PLA
                </h3>
                <div className="h-1"></div>
                <p
                  className="text-[14px] sm:text-[16px] font-normal text-[#7C7C7C] leading-[100%] tracking-[0px]"
                  style={{ fontFamily: 'var(--font-geist-sans)', verticalAlign: 'middle' }}
                >
                  Affordable, biodegradable, and easy to print.
                </p>
              </div>

              {/* Bottom Section */}
              <div className="mt-2 sm:mt-3">
                {/* Options */}
                <div className="border-l-2 border-[#DCDCDC] p-2 gap-2 flex flex-col mb-1">
                  <p
                    className="text-[12px] sm:text-[14px] font-normal text-[#7C7C7C] leading-[100%] tracking-[0px]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <span className="bg-[#FCFCFC] px-2 py-1 rounded">16 Color options</span>
                  </p>
                  <p
                    className="text-[12px] sm:text-[14px] font-normal text-[#7C7C7C] leading-[100%] tracking-[0px]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <span className="bg-[#FCFCFC] px-2 py-1 rounded">4 Layer height options</span>
                  </p>
                </div>

                {/* Best For */}
                <div className="flex items-center gap-1">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Puzzle className="h-4 w-4 text-[#292929]" />
                  </div>
                  <p
                    className="text-[12px] sm:text-[14px] font-normal text-[#292929] leading-[100%] tracking-[0px]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Best for simple models & visual prototypes.
                  </p>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="w-full sm:w-32 md:w-40 lg:w-48 h-40 sm:h-32 md:h-40 lg:h-48 flex-shrink sm:flex-shrink-0 mx-auto sm:mx-0 max-w-full">
              <div className="relative w-full h-full rounded-lg overflow-hidden">
                <Image
                  src="/superfreak-studio-pla.png"
                  alt="PLA Filament Spools"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* PETG Card */}
          <div
            className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4"
            style={{
              boxShadow: '0 4px 20px rgba(119, 119, 119, 0.05)',
            }}
          >
            {/* Content */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
              {/* Top Section */}
              <div>
                <h3
                  className="text-[20px] sm:text-[24px] font-semibold text-[#292929] leading-[100%] tracking-[-0.5px]"
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  PETG
                </h3>
                <div className="h-1"></div>
                <p
                  className="text-[14px] sm:text-[16px] font-normal text-[#7C7C7C] leading-[100%] tracking-[0px]"
                  style={{ fontFamily: 'var(--font-geist-sans)', verticalAlign: 'middle' }}
                >
                  Strong, slightly flexible, and temperature-resistant.
                </p>
              </div>

              {/* Bottom Section */}
              <div className="mt-2 sm:mt-3">
                {/* Options */}
                <div className="border-l-2 border-[#DCDCDC] p-2 gap-2 flex flex-col mb-1">
                  <p
                    className="text-[12px] sm:text-[14px] font-normal text-[#7C7C7C] leading-[100%] tracking-[0px]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <span className="bg-[#FCFCFC] px-2 py-1 rounded">16 Color options</span>
                  </p>
                  <p
                    className="text-[12px] sm:text-[14px] font-normal text-[#7C7C7C] leading-[100%] tracking-[0px]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <span className="bg-[#FCFCFC] px-2 py-1 rounded">4 Layer height options</span>
                  </p>
                </div>

                {/* Best For */}
                <div className="flex items-center gap-1">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Wrench className="h-4 w-4 text-[#292929]" />
                  </div>
                  <p
                    className="text-[12px] sm:text-[14px] font-normal text-[#292929] leading-[100%] tracking-[0px]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Best for strong & durable functional parts.
                  </p>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="w-full sm:w-36 md:w-48 h-40 sm:h-36 md:h-48 flex-shrink-0 mx-auto sm:mx-0">
              <div className="relative w-full h-full rounded-lg overflow-hidden">
                <Image
                  src="/superfreak-studio-pla.png"
                  alt="PETG Filament Spools"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* ABS Card */}
          <div
            className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4"
            style={{
              boxShadow: '0 4px 20px rgba(119, 119, 119, 0.05)',
            }}
          >
            {/* Content */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
              {/* Top Section */}
              <div>
                <h3
                  className="text-[20px] sm:text-[24px] font-semibold text-[#292929] leading-[100%] tracking-[-0.5px]"
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  ABS
                </h3>
                <div className="h-1"></div>
                <p
                  className="text-[14px] sm:text-[16px] font-normal text-[#7C7C7C] leading-[100%] tracking-[0px]"
                  style={{ fontFamily: 'var(--font-geist-sans)', verticalAlign: 'middle' }}
                >
                  Tough, impact-resistant, and ideal for mechanical parts.
                </p>
              </div>

              {/* Bottom Section */}
              <div className="mt-2 sm:mt-3">
                {/* Options */}
                <div className="border-l-2 border-[#DCDCDC] p-2 gap-2 flex flex-col mb-1">
                  <p
                    className="text-[12px] sm:text-[14px] font-normal text-[#7C7C7C] leading-[100%] tracking-[0px]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <span className="bg-[#FCFCFC] px-2 py-1 rounded">16 Color options</span>
                  </p>
                  <p
                    className="text-[12px] sm:text-[14px] font-normal text-[#7C7C7C] leading-[100%] tracking-[0px]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <span className="bg-[#FCFCFC] px-2 py-1 rounded">4 Layer height options</span>
                  </p>
                </div>

                {/* Best For */}
                <div className="flex items-center gap-1">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-[#292929]" />
                  </div>
                  <p
                    className="text-[12px] sm:text-[14px] font-normal text-[#292929] leading-[100%] tracking-[0px]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Best for durable mechanical components & enclosures.
                  </p>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="w-full sm:w-36 md:w-48 h-40 sm:h-36 md:h-48 flex-shrink-0 mx-auto sm:mx-0">
              <div className="relative w-full h-full rounded-lg overflow-hidden">
                <Image
                  src="/superfreak-studio-pla.png"
                  alt="ABS Filament Spools"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* ASA Card */}
          <div
            className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4"
            style={{
              boxShadow: '0 4px 20px rgba(119, 119, 119, 0.05)',
            }}
          >
            {/* Content */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
              {/* Top Section */}
              <div>
                <h3
                  className="text-[20px] sm:text-[24px] font-semibold text-[#292929] leading-[100%] tracking-[-0.5px]"
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  ASA
                </h3>
                <div className="h-1"></div>
                <p
                  className="text-[14px] sm:text-[16px] font-normal text-[#7C7C7C] leading-[100%] tracking-[0px]"
                  style={{ fontFamily: 'var(--font-geist-sans)', verticalAlign: 'middle' }}
                >
                  UV-resistant, weatherproof, and perfect for outdoor use.
                </p>
              </div>

              {/* Bottom Section */}
              <div className="mt-2 sm:mt-3">
                {/* Options */}
                <div className="border-l-2 border-[#DCDCDC] p-2 gap-2 flex flex-col mb-1">
                  <p
                    className="text-[12px] sm:text-[14px] font-normal text-[#7C7C7C] leading-[100%] tracking-[0px]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <span className="bg-[#FCFCFC] px-2 py-1 rounded">16 Color options</span>
                  </p>
                  <p
                    className="text-[12px] sm:text-[14px] font-normal text-[#7C7C7C] leading-[100%] tracking-[0px]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <span className="bg-[#FCFCFC] px-2 py-1 rounded">4 Layer height options</span>
                  </p>
                </div>

                {/* Best For */}
                <div className="flex items-center gap-1">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Sun className="h-4 w-4 text-[#292929]" />
                  </div>
                  <p
                    className="text-[12px] sm:text-[14px] font-normal text-[#292929] leading-[100%] tracking-[0px]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Best for outdoor applications & weather-resistant parts.
                  </p>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="w-full sm:w-36 md:w-48 h-40 sm:h-36 md:h-48 flex-shrink-0 mx-auto sm:mx-0">
              <div className="relative w-full h-full rounded-lg overflow-hidden">
                <Image
                  src="/superfreak-studio-pla.png"
                  alt="ASA Filament Spools"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* TPU Card */}
          <div
            className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4"
            style={{
              boxShadow: '0 4px 20px rgba(119, 119, 119, 0.05)',
            }}
          >
            {/* Content */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
              {/* Top Section */}
              <div>
                <h3
                  className="text-[20px] sm:text-[24px] font-semibold text-[#292929] leading-[100%] tracking-[-0.5px]"
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  TPU
                </h3>
                <div className="h-1"></div>
                <p
                  className="text-[14px] sm:text-[16px] font-normal text-[#7C7C7C] leading-[100%] tracking-[0px]"
                  style={{ fontFamily: 'var(--font-geist-sans)', verticalAlign: 'middle' }}
                >
                  Flexible, elastic, and perfect for rubber-like parts.
                </p>
              </div>

              {/* Bottom Section */}
              <div className="mt-2 sm:mt-3">
                {/* Options */}
                <div className="border-l-2 border-[#DCDCDC] p-2 gap-2 flex flex-col mb-1">
                  <p
                    className="text-[12px] sm:text-[14px] font-normal text-[#7C7C7C] leading-[100%] tracking-[0px]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <span className="bg-[#FCFCFC] px-2 py-1 rounded">16 Color options</span>
                  </p>
                  <p
                    className="text-[12px] sm:text-[14px] font-normal text-[#7C7C7C] leading-[100%] tracking-[0px]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <span className="bg-[#FCFCFC] px-2 py-1 rounded">4 Layer height options</span>
                  </p>
                </div>

                {/* Best For */}
                <div className="flex items-center gap-1">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Waves className="h-4 w-4 text-[#292929]" />
                  </div>
                  <p
                    className="text-[12px] sm:text-[14px] font-normal text-[#292929] leading-[100%] tracking-[0px]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Best for flexible parts, gaskets & shock absorption.
                  </p>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="w-full sm:w-36 md:w-48 h-40 sm:h-36 md:h-48 flex-shrink-0 mx-auto sm:mx-0">
              <div className="relative w-full h-full rounded-lg overflow-hidden">
                <Image
                  src="/superfreak-studio-pla.png"
                  alt="TPU Filament Spools"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* CF (Carbon Fiber) Card */}
          <div
            className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4"
            style={{
              boxShadow: '0 4px 20px rgba(119, 119, 119, 0.05)',
            }}
          >
            {/* Content */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
              {/* Top Section */}
              <div>
                <h3
                  className="text-[20px] sm:text-[24px] font-semibold text-[#292929] leading-[100%] tracking-[-0.5px]"
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  CF
                </h3>
                <div className="h-1"></div>
                <p
                  className="text-[14px] sm:text-[16px] font-normal text-[#7C7C7C] leading-[100%] tracking-[0px]"
                  style={{ fontFamily: 'var(--font-geist-sans)', verticalAlign: 'middle' }}
                >
                  Carbon fiber reinforced for maximum strength & stiffness.
                </p>
              </div>

              {/* Bottom Section */}
              <div className="mt-2 sm:mt-3">
                {/* Options */}
                <div className="border-l-2 border-[#DCDCDC] p-2 gap-2 flex flex-col mb-1">
                  <p
                    className="text-[12px] sm:text-[14px] font-normal text-[#7C7C7C] leading-[100%] tracking-[0px]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <span className="bg-[#FCFCFC] px-2 py-1 rounded">16 Color options</span>
                  </p>
                  <p
                    className="text-[12px] sm:text-[14px] font-normal text-[#7C7C7C] leading-[100%] tracking-[0px]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <span className="bg-[#FCFCFC] px-2 py-1 rounded">4 Layer height options</span>
                  </p>
                </div>

                {/* Best For */}
                <div className="flex items-center gap-1">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Layers className="h-4 w-4 text-[#292929]" />
                  </div>
                  <p
                    className="text-[12px] sm:text-[14px] font-normal text-[#292929] leading-[100%] tracking-[0px]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Best for high-performance & structural applications.
                  </p>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="w-full sm:w-36 md:w-48 h-40 sm:h-36 md:h-48 flex-shrink-0 mx-auto sm:mx-0">
              <div className="relative w-full h-full rounded-lg overflow-hidden">
                <Image
                  src="/superfreak-studio-pla.png"
                  alt="Carbon Fiber Filament Spools"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="flex justify-center">
          <div
            className="bg-[#292929] rounded-[20px] py-2.5 px-3 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-[600px] w-full"
            style={{
              boxShadow: '0px 4px 20px 0px rgba(119, 119, 119, 0.05)',
            }}
          >
            <div className="text-white text-[16px] font-medium text-center sm:text-left">
              We&apos;re adding more filaments soon!
            </div>

            <div className="flex flex-row items-center gap-3">
              <div className="h-px w-6 bg-white/20"></div>
              <span className="text-white/80 text-[14px]">Or</span>
              <div className="h-px w-6 bg-white/20"></div>
            </div>

            <Button
              variant="secondary"
              className="bg-white text-[#292929] hover:bg-[#f7f7f7] border-none whitespace-nowrap text-sm"
            >
              Request Material
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

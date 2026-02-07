'use client'

import React, { useState } from 'react'
import {
  AlertTriangle,
  FileCheck,
  Ruler,
  Package,
  Shield,
  Info,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

export default function FileGuidelinesPage() {
  const [openSection, setOpenSection] = useState<number | null>(null)

  const toggleSection = (id: number) => {
    setOpenSection(openSection === id ? null : id)
  }

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1D0DF3] via-[#2D1DF3] to-[#4D3DF3] py-16 md:py-24 px-6 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <FileCheck className="w-4 h-4 text-white" />
            <span
              className="text-sm text-white font-medium"
              style={{ fontFamily: 'var(--font-geist-mono)' }}
            >
              3D Printing Guidelines
            </span>
          </div>
          <h1
            className="text-[36px] sm:text-[48px] md:text-[56px] font-bold leading-[110%] tracking-[-1px] text-white mb-6"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            File Preparation Made Simple
          </h1>
          <p
            className="text-[16px] sm:text-[18px] md:text-[20px] font-normal leading-[150%] text-white/90 max-w-2xl mx-auto"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Everything you need to know to ensure your 3D prints come out perfect every time
          </p>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-[#F8F8F8] py-8 px-6 md:px-10 border-b border-[#EFEFEF]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div
                className="text-[28px] md:text-[32px] font-bold text-[#1D0DF3]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                4
              </div>
              <div
                className="text-[12px] md:text-[14px] text-[#7C7C7C]"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                File Formats
              </div>
            </div>
            <div className="text-center">
              <div
                className="text-[28px] md:text-[32px] font-bold text-[#1D0DF3]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                1.0mm
              </div>
              <div
                className="text-[12px] md:text-[14px] text-[#7C7C7C]"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                Min Wall Thickness
              </div>
            </div>
            <div className="text-center">
              <div
                className="text-[28px] md:text-[32px] font-bold text-[#1D0DF3]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                220mm
              </div>
              <div
                className="text-[12px] md:text-[14px] text-[#7C7C7C]"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                Max Build Size
              </div>
            </div>
            <div className="text-center">
              <div
                className="text-[28px] md:text-[32px] font-bold text-[#1D0DF3]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                45°
              </div>
              <div
                className="text-[12px] md:text-[14px] text-[#7C7C7C]"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                Max Overhang
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Critical Policies */}
      <section className="py-12 md:py-16 px-6 md:px-10 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-[28px] md:text-[36px] font-bold text-[#292929] mb-8 text-center"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Important Policies
          </h2>

          <div className="space-y-6">
            {/* Prohibited Items */}
            <div className="group relative bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-2xl p-6 md:p-8 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-4 right-4">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="pr-12">
                <h3
                  className="text-[20px] md:text-[24px] font-bold text-red-900 mb-3"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  🚫 Prohibited Items
                </h3>
                <div
                  className="text-[15px] md:text-[16px] leading-[160%] text-red-800 space-y-3"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  <p className="font-semibold text-[17px]">
                    We do NOT accept orders for items that appear to be functional weapons or guns.
                  </p>
                  <p>
                    This includes firearms, firearm components, realistic weapon replicas, or any
                    item that could be mistaken for a real weapon. We reserve the right to refuse
                    any order that violates this policy.
                  </p>
                </div>
              </div>
            </div>

            {/* Support Structures */}
            <div className="group relative bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-2xl p-6 md:p-8 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-4 right-4">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="pr-12">
                <h3
                  className="text-[20px] md:text-[24px] font-bold text-amber-900 mb-3"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  ⚠️ Support Structures & Quality
                </h3>
                <div
                  className="text-[15px] md:text-[16px] leading-[160%] text-amber-800 space-y-3"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  <p>
                    <strong>Important Notice:</strong> If your print requires support structures,
                    we&apos;ll notify you before proceeding.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>
                        You can <strong>agree</strong> or <strong>disagree</strong> to use supports
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>Supports may leave marks requiring post-processing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>
                        <strong>We are not responsible</strong> for quality issues from support
                        removal
                      </span>
                    </li>
                  </ul>
                  <div className="bg-amber-200/50 rounded-lg p-3 mt-4">
                    <p className="font-semibold text-amber-900">
                      By agreeing to use supports, you accept these potential quality variations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* File Formats */}
      <section className="py-12 md:py-16 px-6 md:px-10 bg-[#F8F8F8]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-[28px] md:text-[36px] font-bold text-[#292929] mb-3"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Accepted File Formats
            </h2>
            <p
              className="text-[16px] text-[#7C7C7C]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              We support the most common 3D file formats
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border-2 border-[#1D0DF3] rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3
                    className="text-[20px] font-bold text-[#292929]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    .STL
                  </h3>
                  <p
                    className="text-[14px] text-[#7C7C7C]"
                    style={{ fontFamily: 'var(--font-geist-mono)' }}
                  >
                    Standard Tessellation Language
                  </p>
                </div>
                <div
                  className="bg-[#1D0DF3] text-white text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  RECOMMENDED
                </div>
              </div>
              <p
                className="text-[14px] text-[#656565]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Best compatibility and fastest processing
              </p>
            </div>

            <div className="bg-white border-2 border-[#EFEFEF] rounded-xl p-6 hover:border-[#1D0DF3] hover:shadow-lg transition-all duration-300">
              <h3
                className="text-[20px] font-bold text-[#292929] mb-1"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                .OBJ
              </h3>
              <p
                className="text-[14px] text-[#7C7C7C] mb-2"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                Wavefront Object
              </p>
              <p
                className="text-[14px] text-[#656565]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Widely supported format
              </p>
            </div>

            <div className="bg-white border-2 border-[#EFEFEF] rounded-xl p-6 hover:border-[#1D0DF3] hover:shadow-lg transition-all duration-300">
              <p
                className="text-[14px] text-[#7C7C7C] mb-2"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                3D Manufacturing Format
              </p>
              <p
                className="text-[14px] text-[#656565]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Modern format with metadata
              </p>
            </div>

            <div className="bg-white border-2 border-[#EFEFEF] rounded-xl p-6 hover:border-[#1D0DF3] hover:shadow-lg transition-all duration-300">
              <h3
                className="text-[20px] font-bold text-[#292929] mb-1"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                .STEP / .STP
              </h3>
              <p
                className="text-[14px] text-[#7C7C7C] mb-2"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                Standard for Exchange of Product
              </p>
              <p
                className="text-[14px] text-[#656565]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                CAD engineering format
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Requirements - Accordion Style */}
      <section className="py-12 md:py-16 px-6 md:px-10 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-[28px] md:text-[36px] font-bold text-[#292929] mb-3"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Technical Requirements
            </h2>
            <p
              className="text-[16px] text-[#7C7C7C]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Essential specifications for successful prints
            </p>
          </div>

          <div className="space-y-3">
            {/* Model Requirements */}
            <div className="border-2 border-[#EFEFEF] rounded-xl overflow-hidden hover:border-[#1D0DF3] transition-all duration-300">
              <button
                onClick={() => toggleSection(1)}
                className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-[#F8F8F8] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <span
                    className="text-[18px] font-semibold text-[#292929]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Model Requirements
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-[#7C7C7C] transition-transform duration-300 ${openSection === 1 ? 'rotate-180' : ''}`}
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
              <div
                className={`overflow-hidden transition-all duration-300 ${openSection === 1 ? 'max-h-96' : 'max-h-0'}`}
              >
                <div className="px-6 pb-5 bg-[#F8F8F8]">
                  <ul
                    className="space-y-2 text-[15px] text-[#656565]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Models must be watertight (manifold) with no holes or gaps</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>All normals should face outward</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>No inverted faces or non-manifold edges</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Remove duplicate vertices and overlapping geometry</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Wall Thickness */}
            <div className="border-2 border-[#EFEFEF] rounded-xl overflow-hidden hover:border-[#1D0DF3] transition-all duration-300">
              <button
                onClick={() => toggleSection(2)}
                className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-[#F8F8F8] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Ruler className="w-5 h-5 text-white" />
                  </div>
                  <span
                    className="text-[18px] font-semibold text-[#292929]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Minimum Wall Thickness
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-[#7C7C7C] transition-transform duration-300 ${openSection === 2 ? 'rotate-180' : ''}`}
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
              <div
                className={`overflow-hidden transition-all duration-300 ${openSection === 2 ? 'max-h-96' : 'max-h-0'}`}
              >
                <div className="px-6 pb-5 bg-[#F8F8F8]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border-l-4 border-[#1D0DF3]">
                      <div
                        className="text-[14px] text-[#7C7C7C] mb-1"
                        style={{ fontFamily: 'var(--font-geist-mono)' }}
                      >
                        PLA Material
                      </div>
                      <div
                        className="text-[24px] font-bold text-[#292929]"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        1.0mm
                      </div>
                      <div
                        className="text-[13px] text-[#656565]"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        Minimum thickness
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                      <div
                        className="text-[14px] text-[#7C7C7C] mb-1"
                        style={{ fontFamily: 'var(--font-geist-mono)' }}
                      >
                        PETG Material
                      </div>
                      <div
                        className="text-[24px] font-bold text-[#292929]"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        1.2mm
                      </div>
                      <div
                        className="text-[13px] text-[#656565]"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        Minimum thickness
                      </div>
                    </div>
                  </div>
                  <p
                    className="text-[14px] text-[#656565] mt-3 flex items-start gap-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>Thinner walls may result in weak or failed prints</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Size Limitations */}
            <div className="border-2 border-[#EFEFEF] rounded-xl overflow-hidden hover:border-[#1D0DF3] transition-all duration-300">
              <button
                onClick={() => toggleSection(3)}
                className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-[#F8F8F8] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <span
                    className="text-[18px] font-semibold text-[#292929]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Size Limitations
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-[#7C7C7C] transition-transform duration-300 ${openSection === 3 ? 'rotate-180' : ''}`}
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
              <div
                className={`overflow-hidden transition-all duration-300 ${openSection === 3 ? 'max-h-96' : 'max-h-0'}`}
              >
                <div className="px-6 pb-5 bg-[#F8F8F8]">
                  <div className="bg-white rounded-lg p-5 border-2 border-[#1D0DF3]">
                    <div className="text-center mb-3">
                      <div
                        className="text-[14px] text-[#7C7C7C] mb-2"
                        style={{ fontFamily: 'var(--font-geist-mono)' }}
                      >
                        Maximum Build Volume
                      </div>
                      <div
                        className="text-[28px] font-bold text-[#1D0DF3]"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        220 × 220 × 250 mm
                      </div>
                    </div>
                  </div>
                  <ul
                    className="space-y-2 text-[15px] text-[#656565] mt-4"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <li className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>Minimum feature size: 0.4mm (nozzle diameter)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>Large models may need to be split into multiple parts</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Overhangs */}
            <div className="border-2 border-[#EFEFEF] rounded-xl overflow-hidden hover:border-[#1D0DF3] transition-all duration-300">
              <button
                onClick={() => toggleSection(4)}
                className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-[#F8F8F8] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <span
                    className="text-[18px] font-semibold text-[#292929]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Overhangs & Bridges
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-[#7C7C7C] transition-transform duration-300 ${openSection === 4 ? 'rotate-180' : ''}`}
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
              <div
                className={`overflow-hidden transition-all duration-300 ${openSection === 4 ? 'max-h-96' : 'max-h-0'}`}
              >
                <div className="px-6 pb-5 bg-[#F8F8F8]">
                  <ul
                    className="space-y-2 text-[15px] text-[#656565]"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span>Overhangs beyond 45° typically require support structures</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span>Bridges longer than 10mm may sag without supports</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Consider model orientation to minimize overhangs</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preparation Tips */}
      <section className="py-12 md:py-16 px-6 md:px-10 bg-gradient-to-br from-[#F8F8F8] to-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-[28px] md:text-[36px] font-bold text-[#292929] mb-3"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Pro Tips for Perfect Prints
            </h2>
            <p
              className="text-[16px] text-[#7C7C7C]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Expert recommendations to optimize your files
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: '📏',
                title: 'Scale Correctly',
                desc: 'Ensure your model is at the correct real-world scale (in millimeters)',
              },
              {
                icon: '🔧',
                title: 'Check Mesh Integrity',
                desc: 'Use tools like Meshmixer or Netfabb to repair mesh errors',
              },
              {
                icon: '📊',
                title: 'Optimize Polygon Count',
                desc: 'High-resolution models (over 1M polygons) may slow processing',
              },
              {
                icon: '💧',
                title: 'Add Drainage Holes',
                desc: 'For hollow models, include small holes to prevent air pressure issues',
              },
              {
                icon: '🔄',
                title: 'Consider Orientation',
                desc: 'Think about how the model will be oriented during printing',
              },
              {
                icon: '🧪',
                title: 'Test Small First',
                desc: 'For complex designs, consider printing a smaller test version',
              },
            ].map((tip, index) => (
              <div
                key={index}
                className="bg-white border-2 border-[#EFEFEF] rounded-xl p-5 hover:border-[#1D0DF3] hover:shadow-lg transition-all duration-300"
              >
                <div className="text-[32px] mb-2">{tip.icon}</div>
                <h3
                  className="text-[17px] font-semibold text-[#292929] mb-2"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  {tip.title}
                </h3>
                <p
                  className="text-[14px] text-[#656565] leading-[150%]"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  {tip.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 px-6 md:px-10 bg-gradient-to-br from-[#1D0DF3] to-[#4D3DF3]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
            <Info className="w-8 h-8 text-white" />
          </div>
          <h2
            className="text-[28px] md:text-[36px] font-bold text-white mb-4"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Need Help with Your Files?
          </h2>
          <p
            className="text-[16px] md:text-[18px] text-white/90 mb-8 leading-[160%]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            If you&apos;re unsure whether your file meets our requirements, don&apos;t worry! Our
            team will review your file after upload and contact you if any issues are found.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-[#1D0DF3] px-8 py-4 rounded-xl font-semibold text-[16px] hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Contact Our Team
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </section>
    </div>
  )
}

'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Package, Box, File as FileIcon, ChevronRight } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function HeroUpload() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const processFiles = (files: FileList | File[]) => {
    const allowedExtensions = [
      '.stl',
      '.obj',
      '.step',
      '.stp',
      '.x_t',
      '.iges',
      '.igs',
      '.sldprt',
      '.3mf',
      '.amf',
      '.ply',
      '.dae',
      '.fbx',
      '.gltf',
      '.glb',
    ]

    const validFiles = Array.from(files).filter((file) => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase()
      return allowedExtensions.includes(extension)
    })

    if (validFiles.length === 0) {
      alert(
        'Please select a valid 3D file format (.stl, .obj, .step, .stp, .x_t, .iges, .igs, .sldprt, .3mf, .amf, .ply, .dae, .fbx, .gltf, .glb)',
      )
      return
    }

    const filePromises = Array.from(validFiles).map((file) => {
      return new Promise<{ name: string; size: number; data: string }>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          resolve({
            name: file.name,
            size: file.size,
            data: reader.result as string,
          })
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(filePromises).then((fileData) => {
      sessionStorage.setItem('heroUploadedFiles', JSON.stringify(fileData))
      router.push('/order')
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    processFiles(files)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processFiles(files)
    }
  }
  return (
    <section className="relative min-h-[840px] flex flex-col justify-center bg-white">
      {/* Checkerboard pattern background */}
      <div
        className="absolute inset-0"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gridTemplateRows: 'repeat(6, 1fr)',
          gridGap: '3px',
        }}
      >
        {Array.from({ length: 48 }).map((_, index) => {
          const row = Math.floor(index / 8)
          const col = index % 8
          const isGray = (row + col) % 2 === 1
          return (
            <div
              key={index}
              className={`rounded-[10px] ${
                isGray ? 'bg-gradient-to-b from-[#F0F0F0] to-white' : 'bg-[#FCFCFC]'
              }`}
            ></div>
          )
        })}
      </div>
      {/* Gradient overlay - top */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: 'linear-gradient(to bottom, #FFFFFF 0%, #FFFFFF 20%, transparent 100%)',
        }}
      ></div>
      {/* Gradient overlay - bottom */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: 'linear-gradient(to top, #FFFFFF 0%, transparent 20%, transparent 100%)',
        }}
      ></div>
      <div className="flex justify-center pt-4 relative z-10">
        <button
          onClick={(e) => {
            e.preventDefault()
            const element = document.getElementById('superfreak-originals')
            if (element) {
              const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
              const offsetPosition = elementPosition - 140
              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
              })
            }
          }}
          className="group inline-flex items-center justify-center gap-[10px] rounded-full border border-[#EFEFEF] bg-[#FFFFFF] p-1.5 text-[12px] text-[#292929] shadow-[0_2px_10px_0_#2929290A] cursor-pointer hover:bg-[#F8F8F8] hover:border-[#DCDCDC] hover:shadow-[0_2px_12px_0_#29292915] transition-all duration-200"
        >
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F8F8] text-[#292929] overflow-hidden">
              <Image
                src="/shopee.png"
                alt="Shopee"
                width={16}
                height={16}
                className="object-contain"
              />
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F8F8] text-[#292929] overflow-hidden">
              <Image
                src="/tokopedia.png"
                alt="Tokopedia"
                width={16}
                height={16}
                className="object-contain"
              />
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F8F8] text-[#292929]">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
              </svg>
            </span>
          </span>
          <span className="font-medium text-[14px] leading-none text-[#292929] inline-flex items-center justify-center gap-1">
            100+ Sold This Week!
            <ChevronRight
              className="h-5 w-5 text-[#DCDCDC] transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden
            />
          </span>
        </button>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center mt-6">
        <div className="pointer-events-none absolute -left-12 md:-left-20 top-[5%] -translate-y-1/2 hidden select-none md:block">
          <div className="rotate-[-15deg] rounded-xl border-2 border-[#1A10C3] bg-[#1D0DF3] px-2 py-3 h-[68px] w-[68px] shadow-[-4px_4px_20px_0_rgba(29,13,242,0.25)] grid place-items-center">
            <FileIcon className="h-[42px] w-[42px] text-white" />
          </div>
        </div>
        <div className="pointer-events-none absolute -right-12 md:-right-20 top-[5%] -translate-y-1/2 hidden select-none md:block">
          <div className="rotate-[15deg] rounded-xl border-2 border-[#1A10C3] bg-[#1D0DF3] px-2 py-3 h-[68px] w-[68px] shadow-[-4px_4px_20px_0_rgba(29,13,242,0.25)] grid place-items-center">
            <Package className="h-[42px] w-[42px] text-white" />
          </div>
        </div>

        <h1 className="mt-3 sm:mt-4 text-[36px] sm:text-[56px] font-light leading-none tracking-normal text-[#656565]">
          From{' '}
          <span className="font-semibold bg-gradient-to-b from-[#8F8F8F] to-[#292929] bg-clip-text text-transparent">
            3D File
          </span>{' '}
          to{' '}
          <span className="font-semibold bg-gradient-to-b from-[#8F8F8F] to-[#292929] bg-clip-text text-transparent">
            Delivery
          </span>
        </h1>
        <div className="mt-2 sm:mt-3 text-lg text-[#6b7280]">
          <p className="m-0">No delays, no guessing.</p>
          <p className="m-0">Just upload your model and let us handle the rest.</p>
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-6 sm:mt-8 w-full max-w-3xl px-6 pb-4 lg:w-[644px]">
        <div className="rounded-[20px] border border-[#EFEFEF] bg-gradient-to-b from-white to-[#F8F8F8] p-3 shadow-[0_4px_20px_0_rgba(119,119,119,0.10)] flex flex-col gap-3">
          <div
            className={`rounded-[12px] border border-dashed p-8 flex flex-col items-center text-center transition-colors ${
              isDragging ? 'border-[#1D0DF3] bg-[#1D0DF3]/5' : 'border-[#DCDCDC] bg-transparent'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="mb-3 mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#EFEFEF] bg-[#FCFCFC] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25)]">
              <Box className="h-5 w-5 text-[#292929]" />
            </div>
            <div className="mb-1 text-lg font-semibold text-[#292929]">Upload 3D Models</div>
            <div className="text-sm text-[#6b7280]">
              Supported formats: .stl, .obj, .step, .stp, .x_t, .iges, .igs, .sldprt, .3mf, .amf,
              .ply, .dae, .fbx, .gltf, .glb
              <br />
              Max: 500 MB per file
            </div>
            <div className="mt-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".stl,.obj,.step,.stp,.x_t,.iges,.igs,.sldprt,.3mf,.amf,.ply,.dae,.fbx,.gltf,.glb"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="h-11 min-w-[128px] rounded-[12px] px-4 gap-2 border border-[#292929] !bg-[#292929] text-white hover:!bg-[#333333] shadow-[inset_0_0_0_2px_rgba(126,126,126,0.25)] text-sm"
              >
                Browse Files
              </Button>
            </div>
          </div>

          <div className="text-sm text-[#292929] text-center">
            <a
              href="#"
              className="font-medium text-[12px] md:text-[14px] leading-none text-[#656565] underline underline-offset-4 cursor-pointer hover:text-[#292929] transition-colors duration-200"
            >
              How it Works?
            </a>
            <span className="px-2 font-medium text-[12px] md:text-[14px] leading-none text-[#989898]">
              or
            </span>
            <a
              href="#superfreak-originals"
              onClick={(e) => {
                e.preventDefault()
                const element = document.getElementById('superfreak-originals')
                if (element) {
                  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                  const offsetPosition = elementPosition - 140
                  window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth',
                  })
                }
              }}
              className="font-medium text-[12px] md:text-[14px] leading-none text-[#656565] underline underline-offset-4 cursor-pointer hover:text-[#292929] transition-colors duration-200"
            >
              Check Our Official Products
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'

import Image from 'next/image'

export default function SuperfreakOriginal() {
  const designs = [
    { id: 1, image: '/superfreak-originals/zari-table.jpg', name: 'Zari Table' },
    { id: 2, image: '/superfreak-originals/seafront-table.jpg', name: 'Seafront Table' },
    { id: 3, image: '/superfreak-originals/arkan-table.jpg', name: 'Arkan Table' },
    { id: 4, image: '/superfreak-originals/yao-pendant.jpg', name: 'Yao Pendant' },
    { id: 5, image: '/superfreak-originals/ridged-pendant.jpg', name: 'Ridged Pendant' },
    { id: 6, image: '/superfreak-originals/twisted-pendant.jpg', name: 'Twisted Pendant' },
    { id: 7, image: '/superfreak-originals/pumpkin-pendant.jpg', name: 'Pumpkin Pendant' },
    { id: 8, image: '/superfreak-originals/indaver-1-pendant.jpg', name: 'Invader I Pendant' },
    { id: 9, image: '/superfreak-originals/claw-pendant.jpg', name: 'Claw Pendant' },
    { id: 10, image: '/superfreak-originals/chain-4-pendant.jpg', name: 'Chain IV Pendant' },
    { id: 11, image: '/superfreak-originals/abyssal-1-pendant.jpg', name: 'Abyssal I Pendant' },
  ]

  // Duplicate the designs array for seamless looping
  const duplicatedDesigns = [...designs, ...designs]

  return (
    <section className="px-6 md:px-10 py-12 md:py-16 relative bg-[#F8F8F8]">
      <div className="mx-auto max-w-7xl">
        <div className="pb-10 md:pb-12 pt-10 md:pt-12 bg-black relative rounded-[20px] overflow-hidden">
          {/* Dot pattern background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              zIndex: 1,
            }}
          ></div>
          {/* Gradient overlay from bottom to top */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-30"
            style={{ zIndex: 2 }}
          ></div>
          {/* Left overlay */}
          <div className="absolute left-0 top-0 w-[50px] md:w-[100px] h-full bg-gradient-to-r from-black to-transparent z-30 pointer-events-none rounded-l-[20px]"></div>
          {/* Right overlay */}
          <div className="absolute right-0 top-0 w-[50px] md:w-[100px] h-full bg-gradient-to-l from-black to-transparent z-30 pointer-events-none rounded-r-[20px]"></div>

          <div className="mx-auto bg-transparent relative z-10">
            {/* Logo */}
            <div className="flex justify-center mb-6 md:mb-8">
              <Image
                src="/originals-logo.png"
                alt="Superfreak Originals"
                width={250}
                height={100}
                className="object-contain w-[180px] h-auto md:w-[250px]"
              />
            </div>
            {/* Carousel Container */}
            <div className="overflow-hidden">
              <div
                className="flex gap-2 md:gap-4"
                style={{
                  width: 'max-content',
                  animation: 'slide 40s linear infinite',
                }}
              >
                {duplicatedDesigns.map((design, index) => (
                  <div
                    key={`${design.id}-${index}`}
                    className="h-40 md:h-60 flex-shrink-0 rounded-[20px] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                  >
                    <Image
                      src={design.image}
                      alt={design.name}
                      width={600}
                      height={240}
                      quality={100}
                      className="h-full w-auto object-contain"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Available at Section */}
            <div className="mt-6 md:mt-10 flex flex-col items-center gap-2 md:gap-3 px-4">
              <h3 className="text-white text-sm md:text-[20px] font-medium">Available at</h3>
              <div className="flex flex-col sm:flex-row gap-2 md:gap-4 w-full sm:w-auto">
                {/* Shopee Button */}
                <a
                  href="#"
                  className="flex items-center justify-center gap-2 md:gap-3 pl-1 pr-2 md:pr-3 py-1.5 md:py-1 bg-[#363636] rounded-full hover:bg-[#353535] transition-colors text-sm md:text-base"
                >
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex bg-[#292929] items-center justify-center shrink-0 overflow-hidden">
                    <Image
                      src="/shopee.png"
                      alt="Shopee"
                      width={20}
                      height={20}
                      className="object-contain w-4 h-4 md:w-5 md:h-5"
                    />
                  </div>
                  <span className="text-white font-medium">Shopee</span>
                  <svg
                    className="w-3 h-3 md:w-4 md:h-4 text-gray-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>

                {/* Tokopedia Button */}
                <a
                  href="#"
                  className="flex items-center justify-center gap-2 md:gap-3 pl-1 pr-2 md:pr-3 py-1.5 md:py-1 bg-[#363636] rounded-full hover:bg-[#353535] transition-colors text-sm md:text-base"
                >
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex bg-[#292929] items-center justify-center shrink-0 overflow-hidden">
                    <Image
                      src="/tokopedia.png"
                      alt="Tokopedia"
                      width={20}
                      height={20}
                      className="object-contain w-4 h-4 md:w-5 md:h-5"
                    />
                  </div>
                  <span className="text-white font-medium">Tokopedia</span>
                  <svg
                    className="w-3 h-3 md:w-4 md:h-4 text-gray-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>

                {/* TikTok Shop Button */}
                <a
                  href="#"
                  className="flex items-center justify-center gap-2 md:gap-3 pl-1 pr-2 md:pr-3 py-1.5 md:py-1 bg-[#363636] rounded-full hover:bg-[#353535] transition-colors text-sm md:text-base"
                >
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-[#292929] rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="white">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                    </svg>
                  </div>
                  <span className="text-white font-medium">TikTok Shop</span>
                  <svg
                    className="w-3 h-3 md:w-4 md:h-4 text-gray-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
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
      </div>
    </section>
  )
}

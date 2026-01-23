import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#EFEFEF]">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-16 md:py-20">
        {/* Top Section: Logo and Tagline */}
        <div className="flex flex-col items-center mb-8">
          <div className="leading-none select-none mb-4">
            <Image src="/logo.png" alt="Superfreak Studio" width={230} height={230} />
          </div>
          <p
            className="text-[16px] font-normal text-[#7C7C7C] leading-[140%] tracking-[0px]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Where Quality Meets Scale
          </p>
          {/* Divider */}
          <div
            className="w-full h-px mt-8"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to right, #DCDCDC 0px, #DCDCDC 8px, transparent 8px, transparent 12px)',
              backgroundSize: '16px 1px',
              backgroundRepeat: 'repeat-x',
            }}
          ></div>
        </div>

        {/* Middle Section: Navigation and Social Links */}
        <div className="flex justify-center mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-12 text-sm">
            {/* Menu Column 1 */}
            <div>
              <div
                className="font-semibold text-[#292929] mb-4 text-base"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                Menu
              </div>
              <ul
                className="space-y-3 text-[#6b7280]"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                <li>
                  <a
                    href="/why-us"
                    className="hover:underline hover:text-[#292929] transition-colors"
                  >
                    Why Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline hover:text-[#292929] transition-colors">
                    Materials & Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline hover:text-[#292929] transition-colors">
                    Collaborations
                  </a>
                </li>
              </ul>
            </div>
            {/* Support Column */}
            <div>
              <div
                className="font-semibold text-[#292929] mb-4 text-base"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                Support
              </div>
              <ul
                className="space-y-3 text-[#6b7280]"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                <li>
                  <a href="#" className="hover:underline hover:text-[#292929] transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline hover:text-[#292929] transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="/file-guidelines"
                    className="hover:underline hover:text-[#292929] transition-colors"
                  >
                    File Guidelines
                  </a>
                </li>
              </ul>
            </div>
            {/* Social Column */}
            <div>
              <div
                className="font-semibold text-[#292929] mb-4 text-base"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                Social
              </div>
              <ul
                className="space-y-3 text-[#6b7280]"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                <li>
                  <a href="#" className="hover:underline hover:text-[#292929] transition-colors">
                    Instagram ↗
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline hover:text-[#292929] transition-colors">
                    TikTok ↗
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          className="w-full h-px mb-8"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to right, #DCDCDC 0px, #DCDCDC 8px, transparent 8px, transparent 12px)',
            backgroundSize: '16px 1px',
            backgroundRepeat: 'repeat-x',
          }}
        ></div>

        {/* Bottom Section: Legal and Copyright */}
        <div className="flex flex-col items-center gap-4">
          {/* Legal Links */}
          <div className="flex items-center gap-4" style={{ fontFamily: 'var(--font-geist-mono)' }}>
            <a
              href="#"
              className="text-[14px] text-[#6b7280] hover:underline hover:text-[#292929] transition-colors"
            >
              Privacy Policy
            </a>
            <div className="w-px h-4 bg-[#DCDCDC]"></div>
            <a
              href="#"
              className="text-[14px] text-[#6b7280] hover:underline hover:text-[#292929] transition-colors"
            >
              Term of Use
            </a>
          </div>
          {/* Copyright */}
          <div
            className="text-[14px] text-[#6b7280] text-center"
            style={{ fontFamily: 'var(--font-geist-mono)' }}
          >
            © 2025 PT Orang Aneh Super
            <br />
            All Rights Reserved
          </div>
        </div>
      </div>
    </footer>
  )
}

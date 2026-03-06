import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function Footer() {
  const t = useTranslations('Footer')

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
            {t('tagline')}
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
                {t('menu')}
              </div>
              <ul
                className="space-y-3 text-[#6b7280]"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                <li>
                  <Link href="/why-us" className="hover:underline hover:text-[#292929] transition-colors">
                    {t('whyUs')}
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:underline hover:text-[#292929] transition-colors">
                    {t('materialsPricing')}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline hover:text-[#292929] transition-colors">
                    {t('collaborations')}
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
                {t('support')}
              </div>
              <ul
                className="space-y-3 text-[#6b7280]"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                <li>
                  <a href="#" className="hover:underline hover:text-[#292929] transition-colors">
                    {t('faq')}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline hover:text-[#292929] transition-colors">
                    {t('helpCenter')}
                  </a>
                </li>
                <li>
                  <Link
                    href="/file-guidelines"
                    className="hover:underline hover:text-[#292929] transition-colors"
                  >
                    {t('fileGuidelines')}
                  </Link>
                </li>
              </ul>
            </div>
            {/* Social Column */}
            <div>
              <div
                className="font-semibold text-[#292929] mb-4 text-base"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                {t('social')}
              </div>
              <ul
                className="space-y-3 text-[#6b7280]"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                <li>
                  <a href="#" className="hover:underline hover:text-[#292929] transition-colors">
                    {t('instagram')}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline hover:text-[#292929] transition-colors">
                    {t('tiktok')}
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
              {t('privacyPolicy')}
            </a>
            <div className="w-px h-4 bg-[#DCDCDC]"></div>
            <a
              href="#"
              className="text-[14px] text-[#6b7280] hover:underline hover:text-[#292929] transition-colors"
            >
              {t('termOfUse')}
            </a>
          </div>
          {/* Copyright */}
          <div
            className="text-[14px] text-[#6b7280] text-center"
            style={{ fontFamily: 'var(--font-geist-mono)' }}
          >
            © 2025 PT Orang Aneh Super
            <br />
            {t('allRightsReserved')}
          </div>
        </div>
      </div>
    </footer>
  )
}

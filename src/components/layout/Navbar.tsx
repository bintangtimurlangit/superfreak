'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import SignInModal from '@/components/modals/SignInModal'
import SignUpModal from '@/components/modals/SignUpModal'
import ResetPasswordModal from '@/components/modals/ResetPasswordModal'
import { useSignOut, useAuthSession } from '@/lib/auth/use-auth-session'
import { useLocale, useTranslations } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { useCart } from '@/components/providers/CartProvider'
import {
  ChevronDown,
  MessageSquareText,
  ShoppingCart,
  LogIn,
  Menu,
  X,
  Package,
  User,
  LogOut,
} from 'lucide-react'

function UserProfileSkeleton() {
  return (
    <div className="relative hidden lg:block">
      <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
    </div>
  )
}

function MobileUserProfileSkeleton() {
  return <div className="w-full h-11 bg-gray-200 rounded-lg animate-pulse" />
}

const Navbar = () => {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('Navbar')
  const authSession = useAuthSession()
  const user = authSession.data?.user ?? null
  const isAuthenticated = !!user

  const displayName = user?.name || (user?.email ? String(user.email).split('@')[0] : 'User')
  const initials =
    (user?.name ? String(user.name)[0]?.toUpperCase() : '') ||
    (user?.email ? String(user.email)[0]?.toUpperCase() : '') ||
    'U'
  const profilePictureUrl = user?.image ?? null

  useEffect(() => {
    const handleSessionUpdate = () => {
      router.refresh()
    }
    window.addEventListener('session-updated', handleSessionUpdate)
    return () => window.removeEventListener('session-updated', handleSessionUpdate)
  }, [router])

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false)
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false)
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const languageDropdownDesktopRef = useRef<HTMLDivElement>(null)
  const languageDropdownMobileRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      // Don't close if clicking on logout button or its children
      if (target?.closest('[data-logout-button]')) {
        return
      }

      // Check if click is outside language dropdown (desktop or mobile)
      const insideDesktop = languageDropdownDesktopRef.current?.contains(target)
      const insideMobile = languageDropdownMobileRef.current?.contains(target)
      if (!insideDesktop && !insideMobile) {
        setIsLanguageDropdownOpen(false)
      }

      // Check if click is outside user dropdown
      if (userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        setIsUserDropdownOpen(false)
      }
    }

    // Only add listener when dropdowns are open
    if (isLanguageDropdownOpen || isUserDropdownOpen) {
      // Small delay to ensure button clicks fire first
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside, true)
      }, 100)

      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('click', handleClickOutside, true)
      }
    }
  }, [isLanguageDropdownOpen, isUserDropdownOpen])

  const languages = [
    { locale: 'en' as const, label: t('english'), flagSrc: '/flags/us.svg' },
    { locale: 'id' as const, label: t('bahasaIndonesia'), flagSrc: '/flags/id.svg' },
  ]

  const currentLanguage = languages.find((l) => l.locale === locale) ?? languages[0]
  const { cartCount } = useCart()

  const handleLanguageSelect = (nextLocale: (typeof languages)[number]['locale']) => {
    setIsLanguageDropdownOpen(false)
    // Force full navigation so [locale] segment and messages update reliably
    const path = pathname === '/' ? '' : pathname
    window.location.href = `/${nextLocale}${path}`
  }

  const signOutAuth = useSignOut()

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsUserDropdownOpen(false)
    try {
      await signOutAuth({ callbackURL: '/' })
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/')
    }
  }

  return (
    <header className="sticky top-0 z-50 relative bg-white dark:bg-black">
      <div className="mx-auto">
        <div className="flex items-center justify-between gap-4 sm:gap-6 py-4 px-6 md:px-10">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link
              href="/"
              className="select-none"
              aria-label="Superfreak Studio home"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Image
                src="/logo.png"
                alt="Superfreak Studio"
                width={150}
                height={50}
                className="h-auto w-[120px] sm:w-[150px]"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav
              className="hidden lg:flex items-center gap-6 text-sm shrink-0"
              style={{ fontFamily: 'var(--font-geist-mono)' }}
            >
              <Link
                href="/why-us"
                className="hover:underline underline-offset-4 text-[#292929] dark:text-foreground whitespace-nowrap m-0 p-0"
              >
                {t('whyUs')}
              </Link>
              <Link
                href="#"
                className="hover:underline underline-offset-4 text-[#292929] dark:text-foreground whitespace-nowrap m-0 p-0"
              >
                {t('materialsPricing')}
              </Link>
              <Link
                href="#"
                className="hover:underline underline-offset-4 text-[#292929] dark:text-foreground whitespace-nowrap m-0 p-0"
              >
                {t('collaborations')}
              </Link>
              <Link
                href="/blog"
                className="hover:underline underline-offset-4 text-[#292929] dark:text-foreground whitespace-nowrap m-0 p-0"
              >
                {t('blog')}
              </Link>
            </nav>
          </div>

          {/* Desktop Actions — compact icon row */}
          <div className="hidden md:flex items-center gap-1.5">
            <div className="relative hidden lg:block" ref={languageDropdownDesktopRef}>
              <button
                type="button"
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="inline-flex items-center justify-center gap-1 h-9 px-2 rounded-lg border border-[#EFEFEF] dark:border-white/[.12] bg-[#FCFCFC] dark:bg-[#111111] hover:bg-[#f7f7f7] dark:hover:bg-[#1a1a1a] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25)] dark:shadow-none transition-colors text-[#292929] dark:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                aria-expanded={isLanguageDropdownOpen}
                aria-haspopup="true"
                aria-label={currentLanguage.label}
              >
                <Image
                  src={currentLanguage.flagSrc}
                  alt=""
                  width={18}
                  height={18}
                  className="rounded-sm object-cover flex-shrink-0"
                />
                <ChevronDown
                  className={`h-4 w-4 text-[#989898] flex-shrink-0 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
              {isLanguageDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-44 bg-white dark:bg-black border border-[#EFEFEF] dark:border-white/10 rounded-lg shadow-lg z-50 py-1">
                  {languages.map((language) => (
                    <button
                      key={language.locale}
                      onClick={() => handleLanguageSelect(language.locale)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-[#f5f5f5] dark:hover:bg-white/10 transition-colors flex items-center gap-2 ${
                        currentLanguage.locale === language.locale
                          ? 'bg-[#f5f5f5] dark:bg-white/10 font-medium'
                          : 'text-[#292929] dark:text-foreground'
                      }`}
                    >
                      <Image
                        src={language.flagSrc}
                        alt=""
                        width={14}
                        height={14}
                        className="rounded-sm"
                      />
                      {language.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/contact"
              className="hidden lg:flex group items-center h-9 rounded-lg border border-[#EFEFEF] dark:border-white/[.12] bg-[#FCFCFC] dark:bg-[#111111] hover:bg-[#f7f7f7] dark:hover:bg-[#1a1a1a] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25)] dark:shadow-none transition-colors text-[#292929] dark:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 overflow-hidden w-9 hover:w-[7.5rem] transition-[width] duration-200"
              aria-label={t('contactUs')}
            >
              <span className="flex items-center justify-center w-9 h-9 flex-shrink-0">
                <MessageSquareText className="h-4 w-4" aria-hidden />
              </span>
              <span className="whitespace-nowrap text-sm font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pr-3">
                {t('contactUs')}
              </span>
            </Link>

            <div className="hidden lg:block relative">
              <Link
                href="/cart"
                className="flex group items-center h-9 rounded-lg border border-[#EFEFEF] dark:border-white/[.12] bg-[#FCFCFC] dark:bg-[#111111] hover:bg-[#f7f7f7] dark:hover:bg-[#1a1a1a] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25)] dark:shadow-none transition-colors text-[#292929] dark:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 overflow-hidden w-9 hover:w-[6.5rem] transition-[width] duration-200"
                aria-label={t('myCart')}
              >
                <span className="flex items-center justify-center w-9 h-9 flex-shrink-0">
                  <ShoppingCart className="h-4 w-4" aria-hidden />
                </span>
                <span className="whitespace-nowrap text-sm font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pr-3">
                  {t('myCart')}
                </span>
              </Link>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-[#292929] dark:bg-white text-white dark:text-[#292929] text-[10px] font-semibold border-2 border-white dark:border-[#111111] z-10">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>

            {isAuthenticated && user ? (
              <div className="relative hidden lg:block" ref={userDropdownRef}>
                <button
                  type="button"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-full overflow-hidden border border-[#EFEFEF] dark:border-white/10 bg-[#FCFCFC] dark:bg-[#111111] hover:ring-2 hover:ring-[#EFEFEF] dark:hover:ring-white/20 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  aria-label="Open account menu"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                >
                  {profilePictureUrl ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={profilePictureUrl}
                        alt={displayName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <span className="inline-flex h-full w-full items-center justify-center bg-blue-600 text-white text-sm font-semibold">
                      {initials}
                    </span>
                  )}
                </button>
                {isUserDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1.5 w-56 bg-white dark:bg-black border border-[#EFEFEF] dark:border-white/10 rounded-lg shadow-lg z-50 py-2">
                    <div className="px-3 pb-2 mb-2 border-b border-[#EFEFEF] dark:border-white/10">
                      <p className="text-sm font-medium text-[#292929] dark:text-foreground truncate">
                        {String(displayName)}
                      </p>
                      <p className="text-xs text-[#989898] dark:text-foreground/60 truncate">
                        {user?.email || ''}
                      </p>
                    </div>
                    <Link
                      href="/my-order"
                      className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-[#f5f5f5] dark:hover:bg-white/10 transition-colors text-[#292929] dark:text-foreground"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <Package className="h-4 w-4 mr-2 flex-shrink-0" aria-hidden />
                      {t('myOrder')}
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-[#f5f5f5] dark:hover:bg-white/10 transition-colors text-[#292929] dark:text-foreground"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2 flex-shrink-0" aria-hidden />
                      {t('profile')}
                    </Link>
                    <div
                      data-logout-button="true"
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-[#f5f5f5] dark:hover:bg-white/10 transition-colors text-[#292929] dark:text-foreground cursor-pointer"
                      role="button"
                      tabIndex={0}
                    >
                      <LogOut className="h-4 w-4 mr-2 flex-shrink-0" aria-hidden />
                      {t('logOut')}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="hidden lg:inline-flex h-9 px-3 rounded-lg border border-[#292929] !bg-[#292929] text-white hover:!bg-[#333333] dark:!bg-white dark:text-[#292929] dark:hover:!bg-[#f2f2f2] dark:border-white/20 text-sm"
                onClick={() => setIsSignInModalOpen(true)}
              >
                <LogIn className="h-4 w-4 mr-1.5" aria-hidden />
                {t('signIn')}
              </Button>
            )}
          </div>

          {/* Mobile Actions - Icons Only */}
          <div className="flex md:hidden items-center gap-2">
            {!user ? (
              <div className="h-10 w-10 bg-gray-200 rounded-[12px] animate-pulse" />
            ) : (
              !isAuthenticated && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10 rounded-[12px] border border-[#292929] !bg-[#292929] text-white hover:!bg-[#333333] dark:!bg-white dark:text-[#292929] dark:hover:!bg-[#f2f2f2] dark:border-white/20"
                  aria-label="Sign In"
                  onClick={() => setIsSignInModalOpen(true)}
                >
                  <LogIn className="h-4 w-4" aria-hidden />
                </Button>
              )
            )}
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden />
              ) : (
                <Menu className="h-5 w-5" aria-hidden />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pb-4 border-t border-[#EFEFEF] dark:border-white/10">
            <nav
              className="flex flex-col gap-4 pt-4"
              style={{ fontFamily: 'var(--font-geist-mono)' }}
            >
              <Link
                href="/why-us"
                className="text-base text-[#292929] dark:text-foreground hover:underline underline-offset-4 py-2 text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('whyUs')}
              </Link>
              <Link
                href="#"
                className="text-base text-[#292929] dark:text-foreground hover:underline underline-offset-4 py-2 text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('materialsPricing')}
              </Link>
              <Link
                href="#"
                className="text-base text-[#292929] dark:text-foreground hover:underline underline-offset-4 py-2 text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('collaborations')}
              </Link>
              <Link
                href="/blog"
                className="text-base text-[#292929] dark:text-foreground hover:underline underline-offset-4 py-2 text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('blog')}
              </Link>
            </nav>

            <div className="flex flex-col gap-3 pt-4 mt-4 border-t border-[#EFEFEF] dark:border-white/10">
              <div className="relative" ref={languageDropdownMobileRef}>
                <Button
                  variant="secondary"
                  className="w-full justify-center text-sm"
                  onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                >
                  <span className="mr-2 inline-flex items-center gap-2">
                    <Image
                      src={currentLanguage.flagSrc}
                      alt=""
                      width={16}
                      height={16}
                      className="rounded-sm"
                    />
                    {currentLanguage.label}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </Button>
                {isLanguageDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 w-full bg-white dark:bg-black border border-[#EFEFEF] dark:border-white/10 rounded-lg shadow-lg z-50">
                    {languages.map((language) => (
                      <button
                        key={language.locale}
                        onClick={() => handleLanguageSelect(language.locale)}
                        className={`w-full text-center px-4 py-2 text-sm hover:bg-[#f5f5f5] dark:hover:bg-white/10 transition-colors ${
                          currentLanguage.locale === language.locale
                            ? 'bg-[#f5f5f5] dark:bg-white/10 font-medium'
                            : 'text-[#292929] dark:text-foreground'
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Image
                            src={language.flagSrc}
                            alt=""
                            width={16}
                            height={16}
                            className="rounded-sm"
                          />
                          {language.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/contact" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="secondary" className="w-full justify-center text-sm">
                  <MessageSquareText className="mr-2 h-4 w-4" aria-hidden />
                  {t('contactUs')}
                </Button>
              </Link>

              <Link href="/cart" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="secondary" className="w-full justify-center text-sm relative">
                  <ShoppingCart className="mr-2 h-4 w-4" aria-hidden />
                  {t('myCart')}
                  {cartCount > 0 && (
                    <span className="ml-2 h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full bg-[#292929] dark:bg-white text-white dark:text-[#292929] text-xs font-semibold">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {!user ? (
                <MobileUserProfileSkeleton />
              ) : isAuthenticated && user ? (
                <div className="relative w-full" ref={userDropdownRef}>
                  <Button
                    variant="secondary"
                    className="w-full justify-center h-11 py-1 px-2 gap-2"
                    aria-label="Open account menu"
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  >
                    {profilePictureUrl ? (
                      <div className="relative inline-flex h-9 w-9 rounded-lg overflow-hidden bg-blue-700 flex-shrink-0">
                        <Image
                          src={profilePictureUrl}
                          alt={displayName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <span
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700"
                        aria-hidden
                      >
                        <span className="text-sm font-bold text-white">{initials}</span>
                      </span>
                    )}
                    <span className="flex flex-col leading-tight">
                      <span className="text-sm font-medium">{String(displayName)}</span>
                      <span className="text-[12px] leading-none font-normal text-[#989898] dark:text-foreground/60">
                        {user?.email || ''}
                      </span>
                    </span>
                  </Button>
                  {isUserDropdownOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-full bg-white dark:bg-black border border-[#EFEFEF] dark:border-white/10 rounded-lg shadow-lg z-50">
                      <Link
                        href="/order"
                        className="flex items-center w-full text-center px-4 py-2 text-sm hover:bg-[#f5f5f5] dark:hover:bg-white/10 transition-colors text-[#292929] dark:text-foreground"
                        onClick={() => {
                          setIsUserDropdownOpen(false)
                          setIsMobileMenuOpen(false)
                        }}
                      >
                        <Package className="h-4 w-4 mr-2" aria-hidden />
                        {t('myOrder')}
                      </Link>
                      <Link
                        href="/profile"
                        className="flex items-center w-full text-center px-4 py-2 text-sm hover:bg-[#f5f5f5] dark:hover:bg-white/10 transition-colors text-[#292929] dark:text-foreground"
                        onClick={() => {
                          setIsUserDropdownOpen(false)
                          setIsMobileMenuOpen(false)
                        }}
                      >
                        <User className="h-4 w-4 mr-2" aria-hidden />
                        {t('profile')}
                      </Link>
                      <div
                        data-logout-button="true"
                        onClick={(e) => {
                          handleLogout(e)
                          setIsUserDropdownOpen(false)
                          setIsMobileMenuOpen(false)
                        }}
                        className="flex items-center w-full text-center px-4 py-2 text-sm hover:bg-[#f5f5f5] dark:hover:bg-white/10 transition-colors text-[#292929] dark:text-foreground cursor-pointer"
                        role="button"
                        tabIndex={0}
                      >
                        <LogOut className="h-4 w-4 mr-2" aria-hidden />
                        {t('logOut')}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full justify-center h-11 px-4 gap-2 rounded-[12px] border border-[#292929] !bg-[#292929] text-white hover:!bg-[#333333] shadow-[inset_0_0_0_2px_rgba(126,126,126,0.25)] dark:!bg-white dark:text-[#292929] dark:hover:!bg-[#f2f2f2] dark:border-white/20 dark:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25)] text-sm"
                  onClick={() => {
                    setIsSignInModalOpen(true)
                    setIsMobileMenuOpen(false)
                  }}
                >
                  <LogIn className="h-4 w-4" aria-hidden />
                  {t('signIn')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="dashed-divider" />
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        onSwitchToSignUp={() => setIsSignUpModalOpen(true)}
        onSwitchToResetPassword={() => setIsResetPasswordModalOpen(true)}
      />
      <SignUpModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        onSwitchToSignIn={() => setIsSignInModalOpen(true)}
      />
      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        onSwitchToSignIn={() => setIsSignInModalOpen(true)}
      />
    </header>
  )
}

export default Navbar

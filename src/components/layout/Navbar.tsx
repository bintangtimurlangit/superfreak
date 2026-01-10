'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import SignInModal from '@/components/modals/SignInModal'
import SignUpModal from '@/components/modals/SignUpModal'
import ResetPasswordModal from '@/components/modals/ResetPasswordModal'
import { useSession } from '@/hooks/useSession'
import { ChevronDown, MessageSquareText, ShoppingCart, LogIn, Menu, X } from 'lucide-react'

const Navbar = () => {
  const { user, isSuccess: isAuthenticated, loading, displayName, initials } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('English')
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false)
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
  const languageDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLanguageDropdownOpen(false)
      }
    }

    if (isLanguageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isLanguageDropdownOpen])

  const languages = ['English', 'Bahasa Indonesia']

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language)
    setIsLanguageDropdownOpen(false)
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
                Why Us
              </Link>
              <Link
                href="#"
                className="hover:underline underline-offset-4 text-[#292929] dark:text-foreground whitespace-nowrap flex items-center gap-1 m-0 p-0"
              >
                Materials
              </Link>
              <Link
                href="#"
                className="hover:underline underline-offset-4 text-[#292929] dark:text-foreground whitespace-nowrap m-0 p-0"
              >
                Pricing
              </Link>
              <Link
                href="/blog"
                className="hover:underline underline-offset-4 text-[#292929] dark:text-foreground whitespace-nowrap m-0 p-0"
              >
                Blog
              </Link>
            </nav>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <div className="relative hidden lg:block" ref={languageDropdownRef}>
              <Button
                variant="secondary"
                className="text-sm"
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              >
                <span className="mr-1">{selectedLanguage}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </Button>
              {isLanguageDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-black border border-[#EFEFEF] dark:border-white/10 rounded-lg shadow-lg z-50">
                  {languages.map((language) => (
                    <button
                      key={language}
                      onClick={() => handleLanguageSelect(language)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f5f5f5] dark:hover:bg-white/10 transition-colors ${
                        selectedLanguage === language
                          ? 'bg-[#f5f5f5] dark:bg-white/10 font-medium'
                          : 'text-[#292929] dark:text-foreground'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link href="/contact">
              <Button variant="secondary" className="hidden lg:flex text-sm">
                <MessageSquareText className="mr-2 h-4 w-4" aria-hidden />
                Contact Us
              </Button>
            </Link>

            <Button variant="secondary" className="hidden lg:flex text-sm">
              <ShoppingCart className="mr-2 h-4 w-4" aria-hidden />
              My Cart
            </Button>

            {isAuthenticated && user ? (
              <Button
                variant="secondary"
                size="md"
                className="hidden lg:flex h-11 py-1 pl-1 pr-2 text-left gap-2"
                aria-label="Open account menu"
              >
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700"
                  aria-hidden
                >
                  <span className="text-sm font-bold text-white">{initials}</span>
                </span>
                <span className="hidden sm:flex flex-col leading-tight">
                  <span className="text-sm font-medium">{displayName}</span>
                  <span className="text-[12px] leading-none font-normal text-[#989898] dark:text-foreground/60">
                    {user.email}
                  </span>
                </span>
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="hidden lg:flex h-11 px-4 gap-2 rounded-[12px] border border-[#292929] !bg-[#292929] text-white hover:!bg-[#333333] shadow-[inset_0_0_0_2px_rgba(126,126,126,0.25)] dark:!bg-white dark:text-[#292929] dark:hover:!bg-[#f2f2f2] dark:border-white/20 dark:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25)] text-sm"
                onClick={() => setIsSignInModalOpen(true)}
              >
                <LogIn className="h-4 w-4" aria-hidden />
                Sign In
              </Button>
            )}

          </div>

          {/* Mobile Actions - Icons Only */}
          <div className="flex md:hidden items-center gap-2">
            {!isAuthenticated && (
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-[12px] border border-[#292929] !bg-[#292929] text-white hover:!bg-[#333333] dark:!bg-white dark:text-[#292929] dark:hover:!bg-[#f2f2f2] dark:border-white/20"
                aria-label="Sign In"
                onClick={() => setIsSignInModalOpen(true)}
              >
                <LogIn className="h-4 w-4" aria-hidden />
              </Button>
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
                Why Us
              </Link>
              <Link
                href="#"
                className="text-base text-[#292929] dark:text-foreground hover:underline underline-offset-4 py-2 text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Materials
              </Link>
              <Link
                href="#"
                className="text-base text-[#292929] dark:text-foreground hover:underline underline-offset-4 py-2 text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/blog"
                className="text-base text-[#292929] dark:text-foreground hover:underline underline-offset-4 py-2 text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Blog
              </Link>
            </nav>

            <div className="flex flex-col gap-3 pt-4 mt-4 border-t border-[#EFEFEF] dark:border-white/10">
              <div className="relative" ref={languageDropdownRef}>
                <Button
                  variant="secondary"
                  className="w-full justify-center text-sm"
                  onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                >
                  <span className="mr-2">{selectedLanguage}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </Button>
                {isLanguageDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 w-full bg-white dark:bg-black border border-[#EFEFEF] dark:border-white/10 rounded-lg shadow-lg z-50">
                    {languages.map((language) => (
                      <button
                        key={language}
                        onClick={() => handleLanguageSelect(language)}
                        className={`w-full text-center px-4 py-2 text-sm hover:bg-[#f5f5f5] dark:hover:bg-white/10 transition-colors ${
                          selectedLanguage === language
                            ? 'bg-[#f5f5f5] dark:bg-white/10 font-medium'
                            : 'text-[#292929] dark:text-foreground'
                        }`}
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/contact" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="secondary" className="w-full justify-center text-sm">
                  <MessageSquareText className="mr-2 h-4 w-4" aria-hidden />
                  Contact Us
                </Button>
              </Link>

              <Button variant="secondary" className="w-full justify-center text-sm">
                <ShoppingCart className="mr-2 h-4 w-4" aria-hidden />
                My Cart
              </Button>

              {isAuthenticated && user ? (
                <Button
                  variant="secondary"
                  className="w-full justify-center h-11 py-1 px-2 gap-2"
                  aria-label="Open account menu"
                >
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700"
                    aria-hidden
                  >
                    <span className="text-sm font-bold text-white">{initials}</span>
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-sm font-medium">{displayName}</span>
                    <span className="text-[12px] leading-none font-normal text-[#989898] dark:text-foreground/60">
                      {user.email}
                    </span>
                  </span>
                </Button>
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
                  Sign In
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

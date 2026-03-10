import React from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import '@/styles/global.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SmoothScroll from '@/components/layout/SmoothScroll'
import OrderRedirectHandler from '@/components/orders/OrderRedirectHandler'
import { BetterAuthProvider } from '@/lib/auth/context'
import { getContextProps } from '@/lib/auth/context/get-context-props'
import QueryProvider from '@/components/providers/QueryProvider'
import { CartProvider } from '@/components/providers/CartProvider'
import { routing } from '@/i18n/routing'
import { getMessages } from 'next-intl/server'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// Avoid prerendering at build time (no MongoDB in Docker builder); render at runtime only
export const dynamic = 'force-dynamic'

export const metadata = {
  description: 'Where Quality Meets Scale',
  title: 'Superfreak Studio',
  icons: {
    icon: '/favicon.png',
  },
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  type AppLocale = (typeof routing.locales)[number]
  if (!routing.locales.includes(locale as AppLocale)) {
    notFound()
  }

  // Enable static rendering for next-intl where possible
  setRequestLocale(locale)

  const messages = await getMessages()

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className={`${geistSans.className} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <BetterAuthProvider {...getContextProps()}>
            <QueryProvider>
              <CartProvider>
                <SmoothScroll />
                <OrderRedirectHandler />
                <Navbar />
                <main>{children}</main>
                <Footer />
              </CartProvider>
            </QueryProvider>
          </BetterAuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}


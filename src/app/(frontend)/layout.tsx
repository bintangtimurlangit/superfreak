import React from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import '@/styles/global.css'
import '@/styles/payloadStyles.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SmoothScroll from '@/components/layout/SmoothScroll'
import OrderRedirectHandler from '@/components/orders/OrderRedirectHandler'
import { BetterAuthProvider } from '@/lib/auth/context'
import { getContextProps } from '@/lib/auth/context/get-context-props'
import QueryProvider from '@/components/providers/QueryProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  description: 'Where Quality Meets Scale',
  title: 'Superfreak Studio',
  icons: {
    icon: '/favicon.png',
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className={`${geistSans.className} antialiased`}>
        <BetterAuthProvider {...getContextProps()}>
        <QueryProvider>
            <SmoothScroll />
            <OrderRedirectHandler />
            <Navbar />
            <main>{children}</main>
            <Footer />
        </QueryProvider>
        </BetterAuthProvider>
      </body>
    </html>
  )
}

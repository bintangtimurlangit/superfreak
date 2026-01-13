import React from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import '@/styles/global.css'
import '@/styles/payloadStyles.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SmoothScroll from '@/components/layout/SmoothScroll'
import OrderRedirectHandler from '@/components/OrderRedirectHandler'
import { SessionProvider } from '@/contexts/SessionContext'

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
        <SessionProvider>
          <SmoothScroll />
          <OrderRedirectHandler />
          <Navbar />
          <main>{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  )
}

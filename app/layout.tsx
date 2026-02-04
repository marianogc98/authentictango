import React from "react"
import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Umami } from '@/components/Umami'
import './globals.css'

const playfair = Playfair_Display({ subsets: ["latin"], variable: '--font-serif' });
const inter = Inter({ subsets: ["latin"], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'The Authentic Tango Experience',
  description: 'Descubre el alma del tango en Buenos Aires con tours privados y grupales. Experiencias educativas, corporativas y universitarias. Reserva tu tour ahora.',
  generator: 'v0.app',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className={`${inter.variable} ${playfair.variable}`}>
      <body className={`font-sans antialiased`}>
        {children}
        <Umami />
        <Analytics />
      </body>
    </html>
  )
}

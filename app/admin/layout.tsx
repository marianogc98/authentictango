import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Panel · The Authentic Tango Experience',
  // El panel nunca se indexa, pase lo que pase con el robots.txt.
  robots: { index: false, follow: false },
}

/**
 * El panel trae su propio <html> porque app/layout.tsx es de paso: el <html> del sitio
 * público vive en [locale], que sabe el idioma. Acá siempre es español.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased bg-background text-foreground">{children}</body>
    </html>
  )
}

import React from 'react'
import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import { JsonLd } from '@/components/JsonLd'
import { negocioSchema } from '@/lib/seo/schema'
import { SITE_URL } from '@/lib/site'
import { routing } from '@/i18n/routing'
import '../globals.css'

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' })
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo' })

  const title = t('title')
  const description = t('description')

  return {
    // Base para resolver las URLs relativas: Open Graph las necesita absolutas.
    metadataBase: new URL(SITE_URL),
    title,
    description,
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      siteName: 'The Authentic Tango Experience',
      locale: locale === 'es' ? 'es_AR' : 'en_US',
      title,
      description,
      images: [{ url: '/og.png', width: 1200, height: 630, alt: t('ogAlt') }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og.png'],
    },
    icons: { icon: '/icon.png', apple: '/icon.png' },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  // Habilita el renderizado estático: sin esto, usar traducciones vuelve dinámica la página.
  setRequestLocale(locale)

  const messages = await getMessages({ locale })

  return (
    <html lang={locale} className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
        <JsonLd data={negocioSchema(locale)} />
        <GoogleAnalytics />
      </body>
    </html>
  )
}

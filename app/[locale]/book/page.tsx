import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { alternatesFor } from '@/lib/seo/alternates'
import { Reserva } from '@/components/reserva'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'book.seo' })

  return {
    title: t('title'),
    description: t('description'),
    alternates: alternatesFor(locale, '/book'),
  }
}

/**
 * La página es estática y la disponibilidad se pide desde el cliente a /api/availability.
 *
 * Hacerla dinámica para renderizar el calendario en el servidor la volvería más lenta y
 * la sacaría del prerender, sin ganar nada: la disponibilidad cambia con cada reserva,
 * así que en el HTML ya vendría vieja.
 */
export default async function BookPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-secondary py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <Reserva locale={locale} />
        </div>
      </main>
      <Footer />
    </>
  )
}

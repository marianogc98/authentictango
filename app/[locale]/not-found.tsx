import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NoEncontrado } from '@/components/no-encontrado'
import { Link } from '@/i18n/navigation'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * El 404 de todo lo que cuelga de un idioma: una URL vieja, un slug mal tipeado, o un
 * `notFound()` desde una página.
 *
 * No lleva el header: es el único lugar del sitio donde los links del menú —que hacen
 * scroll a secciones del home— no llevan a ningún lado.
 */
export default async function NotFoundPage() {
  const t = await getTranslations('notFound')

  return (
    <NoEncontrado badge={t('badge')} titulo={t('title')} mensaje={t('message')}>
      <Button asChild size="lg" className="px-8 text-base">
        <Link href="/">
          <ArrowLeft className="mr-2 h-5 w-5" />
          {t('backHome')}
        </Link>
      </Button>
      <Button
        asChild
        size="lg"
        variant="outline"
        className="border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10 hover:text-white"
      >
        <Link href="/book">
          <CalendarDays className="mr-2 h-5 w-5" />
          {t('book')}
        </Link>
      </Button>
    </NoEncontrado>
  )
}

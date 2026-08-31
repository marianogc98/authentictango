import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'

/**
 * Todo lo que cuelga de un idioma y no existe.
 *
 * Sin esta ruta, `/es/cualquier-cosa` no matchea ningún segmento y el 404 lo resuelve el
 * global, que está en inglés.
 *
 * El `setRequestLocale` va antes del `notFound()` a propósito: la pantalla de 404 se
 * renderiza fuera de la página, y sin el idioma fijado acá, `getTranslations` no lo
 * puede deducir de la URL y cae al locale por defecto. El síntoma era mudo —404 en
 * inglés para alguien navegando en español— porque no falla nada, sólo traduce mal.
 */
export default async function RestoNoEncontrado({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (routing.locales.includes(locale as (typeof routing.locales)[number])) {
    setRequestLocale(locale)
  }

  notFound()
}

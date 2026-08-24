import { SITE_URL } from '@/lib/site'
import { routing } from '@/i18n/routing'

/**
 * URL absoluta de una ruta en un idioma dado, respetando `localePrefix: 'as-needed'`
 * (el idioma por defecto va sin prefijo).
 */
export function urlFor(locale: string, path = '/') {
  const prefijo = locale === routing.defaultLocale ? '' : `/${locale}`
  const ruta = path === '/' ? '' : path
  return `${SITE_URL}${prefijo}${ruta}` || `${SITE_URL}/`
}

/**
 * Bloque `alternates` para el metadata de una página: canonical apuntando a sí misma
 * más el hreflang de cada idioma. Sin esto Google elige una versión y descarta la otra.
 */
export function alternatesFor(locale: string, path = '/') {
  const languages: Record<string, string> = {}
  for (const l of routing.locales) languages[l] = urlFor(l, path)
  languages['x-default'] = urlFor(routing.defaultLocale, path)

  return { canonical: urlFor(locale, path), languages }
}

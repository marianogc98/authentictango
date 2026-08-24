import { SITE_URL } from '@/lib/site'
import { routing } from '@/i18n/routing'

type Definicion = string | Record<string, string>

/**
 * Traduce una ruta interna al slug que le corresponde en ese idioma.
 *
 * next-intl mapea `/book` a `/reservar` en español. Sin este paso, la canonical, el
 * hreflang y el sitemap declararían `/es/book`, que existe pero redirige — y un sitemap
 * con URLs que redirigen es exactamente lo que no hay que publicar.
 */
function rutaLocalizada(locale: string, path: string): string {
  const def = (routing.pathnames as Record<string, Definicion>)[path]
  if (!def) return path
  if (typeof def === 'string') return def
  return def[locale] ?? path
}

/**
 * URL absoluta de una ruta en un idioma dado, respetando `localePrefix: 'as-needed'`
 * (el idioma por defecto va sin prefijo) y los slugs traducidos.
 */
export function urlFor(locale: string, path = '/') {
  const prefijo = locale === routing.defaultLocale ? '' : `/${locale}`
  const ruta = rutaLocalizada(locale, path)
  const limpia = ruta === '/' ? '' : ruta
  return `${SITE_URL}${prefijo}${limpia}` || `${SITE_URL}/`
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

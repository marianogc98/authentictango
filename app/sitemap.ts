import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { alternatesFor, urlFor } from '@/lib/seo/alternates'

/**
 * Sólo se listan URLs que devuelven 200 y son indexables.
 * Quedan fuera a propósito `/thank-you`, `/gracias` y `/book/[uid]`: todas llevan
 * `noindex`, y la última además es una URL personal con datos de alguien.
 *
 * Las URLs salen del mismo helper que las canonical, así no pueden divergir: un sitemap
 * que declara una URL distinta de la canonical es una señal contradictoria.
 */
const RUTAS: Array<{ path: string; priority: number }> = [
  { path: '/', priority: 1 },
  { path: '/book', priority: 0.9 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return RUTAS.flatMap(({ path, priority }) =>
    routing.locales.map((locale) => ({
      url: urlFor(locale, path),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority,
      alternates: { languages: alternatesFor(locale, path).languages },
    })),
  )
}

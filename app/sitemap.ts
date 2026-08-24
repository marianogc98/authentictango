import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { alternatesFor, urlFor } from '@/lib/seo/alternates'

/**
 * Sólo se listan URLs que devuelven 200 y son indexables.
 * `/thank-you` y `/gracias` quedan fuera a propósito: llevan `noindex`.
 *
 * Las URLs salen del mismo helper que las canonical, así no pueden divergir:
 * un sitemap que declara una URL distinta de la canonical es una señal contradictoria.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return routing.locales.map((locale) => ({
    url: urlFor(locale, '/'),
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 1,
    alternates: { languages: alternatesFor(locale, '/').languages },
  }))
}

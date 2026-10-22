import { asc } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { galleryImages } from '@/lib/db/schema'

export type ImagenGaleria = { id: number; src: string; alt: string }

/**
 * Las fotos con las que vino el sitio. Se muestran si la base no contesta —por ejemplo
 * en el build, que no la alcanza—: una galería con las fotos de siempre es mejor que un
 * hueco.
 */
const DE_SIEMPRE: { src: string; es: string; en: string }[] = [
  { src: '/images/hero-tango.webp', es: 'Pareja bailando tango', en: 'Couple dancing tango' },
  { src: '/images/gallery-1.jpg', es: 'Pies de bailarines de tango', en: 'Feet of tango dancers' },
  { src: '/images/gallery-2.webp', es: 'Barrio San Telmo', en: 'San Telmo neighborhood' },
  { src: '/images/gallery-3.webp', es: 'Interior de milonga tradicional', en: 'Inside a traditional milonga' },
  { src: '/images/gallery-4.webp', es: 'Orquesta de tango en vivo', en: 'Live tango orchestra' },
  { src: '/images/gallery-5.webp', es: 'Barrio La Boca', en: 'La Boca neighborhood' },
]

export async function imagenesGaleria(locale: string): Promise<ImagenGaleria[]> {
  try {
    const filas = await db
      .select()
      .from(galleryImages)
      .orderBy(asc(galleryImages.position), asc(galleryImages.id))
    return filas.map((f) => ({ id: f.id, src: f.src, alt: locale === 'es' ? f.altEs : f.altEn }))
  } catch (err) {
    console.error('[galeria]', err instanceof Error ? err.message : err)
    return DE_SIEMPRE.map((f, i) => ({ id: -i - 1, src: f.src, alt: locale === 'es' ? f.es : f.en }))
  }
}

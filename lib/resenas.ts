import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { reviews } from '@/lib/db/schema'

/** Lo que la home necesita de una reseña, ya en el idioma de la página. */
export type ResenaPublica = {
  id: number
  nombre: string
  estrellas: number
  /** El mes ya escrito: "diciembre de 2025", "December 2025". */
  mes: string
  texto: string
}

/**
 * "2025-12-01" → "Diciembre de 2025". En UTC porque la fecha no tiene hora: en la zona
 * de Buenos Aires el 1 de diciembre a medianoche UTC todavía es 30 de noviembre.
 */
function mesEscrito(fecha: string, locale: string): string {
  const texto = new Intl.DateTimeFormat(locale === 'es' ? 'es-AR' : 'en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${fecha}T00:00:00Z`))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/**
 * Las reseñas visibles, la más nueva primero. Si la base no contesta devuelve una lista
 * vacía: la sección pierde el carrusel, pero la home no se cae.
 */
export async function resenasPublicas(locale: string): Promise<ResenaPublica[]> {
  try {
    const filas = await db
      .select()
      .from(reviews)
      .where(eq(reviews.visible, true))
      .orderBy(desc(reviews.date), desc(reviews.id))

    return filas.map((r) => ({
      id: r.id,
      nombre: r.name,
      estrellas: r.rating,
      mes: mesEscrito(r.date, locale),
      texto: locale === 'es' ? r.textEs : r.textEn,
    }))
  } catch (err) {
    console.error('[resenas]', err instanceof Error ? err.message : err)
    return []
  }
}

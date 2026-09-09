import { sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { weeklySlots } from '@/lib/db/schema'

/**
 * El precio más bajo en dólares con el que hoy se puede comprar cada experiencia, en
 * centavos. Cada una se declara sólo si algún horario la vende: son dos productos
 * independientes, y puede haber semanas en las que sólo se ofrezca uno.
 *
 * Sale de la plantilla semanal y no de un texto fijo: el schema declara un precio a Google
 * y a los asistentes de IA, y un precio declarado que no coincide con el que se cobra al
 * reservar es peor que no declarar ninguno.
 *
 * Sólo dólares: es el precio que ella carga. El de pesos se deriva del blue y cambia todos
 * los días, así que no es un dato para publicar en un dato estructurado que se cachea.
 */
export type PrecioDesde = { tour: number | null; conClase: number | null }

export async function precioDesde(): Promise<PrecioDesde | null> {
  try {
    const [fila] = await db
      .select({
        tour: sql<number | null>`MIN(${weeklySlots.priceUsd}) FILTER (WHERE ${weeklySlots.priceUsd} > 0)`,
        conClase: sql<number | null>`
          MIN(${weeklySlots.classPriceUsd}) FILTER (WHERE ${weeklySlots.classPriceUsd} > 0)
        `,
      })
      .from(weeklySlots)

    const tour = Number(fila?.tour ?? 0)
    const conClase = Number(fila?.conClase ?? 0)
    // Sin ningún horario con precio no hay nada que declarar.
    if (!tour && !conClase) return null

    return { tour: tour > 0 ? tour : null, conClase: conClase > 0 ? conClase : null }
  } catch (err) {
    // La home no puede caerse porque la base no conteste: sin precio se emite el schema
    // sin ofertas, que es incompleto pero válido.
    console.error('[seo/oferta]', err instanceof Error ? err.message : err)
    return null
  }
}

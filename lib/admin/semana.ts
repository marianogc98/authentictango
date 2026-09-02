'use server'

import { db } from '@/lib/db/client'
import { weeklySlots } from '@/lib/db/schema'
import { getCotizacion } from '@/lib/cotizacion'
import { aCentavos, usdAPesos } from '@/lib/booking/dinero'

export type SlotEntrada = {
  time: string      // "15:00"
  seats: number
  priceUsd: string  // tal como se tipeó
  /** El adicional por persona de la clase grupal. En cero, ese horario no la ofrece. */
  classPriceUsd: string
}

export type SemanaEntrada = Record<number, SlotEntrada[]>

/**
 * Reemplaza la plantilla semanal completa.
 *
 * Se borra y se reinserta en una transacción en vez de hacer un diff fila por fila:
 * la tabla tiene a lo sumo un puñado de filas, y un reemplazo atómico no puede quedar
 * a mitad de camino con una semana inconsistente.
 *
 * El precio en pesos no se pide: se calcula con el blue del momento. Lo que se guarda en
 * `price_ars` es una foto de ese cálculo, y sirve de red por si más adelante las fuentes
 * de la cotización no responden. El valor que se muestra y se cobra se recalcula siempre.
 */
export async function guardarSemana(semana: SemanaEntrada) {
  const cotizacion = await getCotizacion()

  // Si justo hoy las fuentes no contestan, no se pisa la foto anterior con ceros: dejar
  // el horario sin precio en pesos sería sacarlo de la venta por un problema ajeno.
  const previas = cotizacion
    ? new Map<string, { priceArs: number; classPriceArs: number }>()
    : new Map(
        (await db.select().from(weeklySlots)).map((f) => [
          `${f.weekday}-${f.time}`,
          { priceArs: f.priceArs, classPriceArs: f.classPriceArs },
        ]),
      )

  const filas = Object.entries(semana).flatMap(([weekday, slots]) =>
    slots
      .filter((s) => /^\d{2}:\d{2}$/.test(s.time))
      .map((s) => {
        const time = `${s.time}:00`
        const previa = previas.get(`${weekday}-${time}`)
        return {
          weekday: Number(weekday),
          time,
          seats: Math.max(1, Math.min(200, Math.trunc(s.seats) || 1)),
          priceUsd: aCentavos(s.priceUsd),
          priceArs: cotizacion
            ? usdAPesos(aCentavos(s.priceUsd), cotizacion.venta)
            : previa?.priceArs ?? 0,
          classPriceUsd: aCentavos(s.classPriceUsd),
          classPriceArs: cotizacion
            ? usdAPesos(aCentavos(s.classPriceUsd), cotizacion.venta)
            : previa?.classPriceArs ?? 0,
        }
      }),
  )

  // Un mismo día no puede tener dos veces el mismo horario: es la clave primaria.
  const vistos = new Set<string>()
  const unicas = filas.filter((f) => {
    const k = `${f.weekday}-${f.time}`
    if (vistos.has(k)) return false
    vistos.add(k)
    return true
  })

  await db.transaction(async (tx) => {
    await tx.delete(weeklySlots)
    if (unicas.length) await tx.insert(weeklySlots).values(unicas)
  })

  return { ok: true, filas: unicas.length }
}

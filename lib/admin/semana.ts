'use server'

import { db } from '@/lib/db/client'
import { weeklySlots } from '@/lib/db/schema'
import { aCentavos } from '@/lib/booking/dinero'

export type SlotEntrada = {
  time: string      // "15:00"
  seats: number
  priceUsd: string  // tal como se tipeó
  priceArs: string
}

export type SemanaEntrada = Record<number, SlotEntrada[]>

/**
 * Reemplaza la plantilla semanal completa.
 *
 * Se borra y se reinserta en una transacción en vez de hacer un diff fila por fila:
 * la tabla tiene a lo sumo un puñado de filas, y un reemplazo atómico no puede quedar
 * a mitad de camino con una semana inconsistente.
 */
export async function guardarSemana(semana: SemanaEntrada) {
  const filas = Object.entries(semana).flatMap(([weekday, slots]) =>
    slots
      .filter((s) => /^\d{2}:\d{2}$/.test(s.time))
      .map((s) => ({
        weekday: Number(weekday),
        time: `${s.time}:00`,
        seats: Math.max(1, Math.min(200, Math.trunc(s.seats) || 1)),
        priceUsd: aCentavos(s.priceUsd),
        priceArs: aCentavos(s.priceArs),
      })),
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

import { and, eq, gte, lte, sql, inArray } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { bookings, closedDates, dateSlots, weeklySlots } from '@/lib/db/schema'
import { fechasDelMes, weekdayDe, yaPaso } from './tiempo'

export type Slot = {
  time: string
  seats: number
  seatsTaken: number
  seatsLeft: number
  priceUsd: number
  priceArs: number
  classPriceUsd: number
  classPriceArs: number
  past: boolean
}

export type DiaDisponible = {
  date: string
  closed: boolean
  /** true si la fecha tiene horarios propios cargados, en vez de heredar la plantilla. */
  custom: boolean
  slots: Slot[]
}

/**
 * Resuelve la disponibilidad de un mes entero en 4 consultas, sin N+1.
 *
 * La regla de precedencia es: si una fecha está en `closed_dates` no hay nada; si tiene
 * filas propias en `date_slots`, ésas reemplazan la plantilla por completo; si no,
 * hereda `weekly_slots` de su día de la semana.
 *
 * Reemplazar la plantilla entera (y no mezclarla con las excepciones) evita el caso
 * ambiguo de "cargué las 11 para el 24, ¿sigue habiendo tour a las 15?".
 */
export async function getMonthAvailability(year: number, month: number): Promise<DiaDisponible[]> {
  const fechas = fechasDelMes(year, month)
  const desde = fechas[0]
  const hasta = fechas[fechas.length - 1]

  const [semanal, cerrados, propios, tomados] = await Promise.all([
    db.select().from(weeklySlots),

    db.select().from(closedDates)
      .where(and(gte(closedDates.date, desde), lte(closedDates.date, hasta))),

    db.select().from(dateSlots)
      .where(and(gte(dateSlots.date, desde), lte(dateSlots.date, hasta))),

    // Un solo agregado para todo el mes: asientos comprometidos por slot.
    db.select({
      date: bookings.date,
      time: bookings.time,
      seats: sql<number>`SUM(${bookings.seats})::int`,
    })
      .from(bookings)
      .where(and(
        gte(bookings.date, desde),
        lte(bookings.date, hasta),
        sql`(${bookings.status} = 'paid' OR (${bookings.status} = 'pending' AND ${bookings.expiresAt} > now()))`,
      ))
      .groupBy(bookings.date, bookings.time),
  ])

  const cerradas = new Set(cerrados.map((c) => c.date))
  const porFecha = new Map<string, typeof propios>()
  for (const s of propios) {
    const lista = porFecha.get(s.date) ?? []
    lista.push(s)
    porFecha.set(s.date, lista)
  }
  const ocupados = new Map(tomados.map((t) => [`${t.date}T${t.time}`, Number(t.seats)]))

  return fechas.map((date) => {
    if (cerradas.has(date)) return { date, closed: true, custom: false, slots: [] }

    const custom = porFecha.get(date)
    const base = custom ?? semanal.filter((s) => s.weekday === weekdayDe(date))

    const slots: Slot[] = base
      .map((s) => {
        const seatsTaken = ocupados.get(`${date}T${s.time}`) ?? 0
        return {
          time: s.time,
          seats: s.seats,
          seatsTaken,
          seatsLeft: Math.max(0, s.seats - seatsTaken),
          priceUsd: s.priceUsd,
          priceArs: s.priceArs,
          classPriceUsd: s.classPriceUsd,
          classPriceArs: s.classPriceArs,
          past: yaPaso(date, s.time),
        }
      })
      .sort((a, b) => a.time.localeCompare(b.time))

    return { date, closed: false, custom: Boolean(custom), slots }
  })
}

/** Resuelve un único slot, con la misma precedencia que el mes. Devuelve null si no existe. */
export async function resolverSlot(date: string, time: string) {
  const [cerrado] = await db.select().from(closedDates).where(eq(closedDates.date, date))
  if (cerrado) return null

  const propios = await db.select().from(dateSlots).where(eq(dateSlots.date, date))
  if (propios.length > 0) return propios.find((s) => s.time === time) ?? null

  const semanal = await db.select().from(weeklySlots)
    .where(and(eq(weeklySlots.weekday, weekdayDe(date)), eq(weeklySlots.time, time)))
  return semanal[0] ?? null
}

/** Marca como `expired` los holds vencidos. Los asientos se liberan solos al dejar de contar. */
export async function expirarHolds() {
  const vencidas = await db
    .update(bookings)
    .set({ status: 'expired' })
    .where(and(eq(bookings.status, 'pending'), sql`${bookings.expiresAt} <= now()`))
    .returning({ uid: bookings.uid })
  return vencidas.length
}

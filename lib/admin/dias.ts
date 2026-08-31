'use server'

import { and, asc, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db/client'
import { bookings, closedDates, dateSlots, weeklySlots } from '@/lib/db/schema'
import { aCentavos } from '@/lib/booking/dinero'
import { weekdayDe } from '@/lib/booking/tiempo'

export type SlotEntrada = {
  time: string; seats: number; priceUsd: string; priceArs: string
  classPriceUsd: string; classPriceArs: string
}

/** Reservas vivas de una fecha: las que hay que respetar sí o sí. */
async function reservasVivas(date: string) {
  return db
    .select({
      uid: bookings.uid, time: bookings.time, seats: bookings.seats,
      withClass: bookings.withClass,
      name: bookings.name, email: bookings.email, phone: bookings.phone,
      status: bookings.status, amount: bookings.amount, currency: bookings.currency,
    })
    .from(bookings)
    .where(and(
      eq(bookings.date, date),
      // Un hold vencido no es una reserva: sin este filtro, el manifiesto del día se
      // llenaba de fantasmas en "Esperando pago" que nunca iban a llegar. El estado
      // 'expired' no se escribe en ningún lado, así que el vencimiento se calcula acá,
      // igual que en la disponibilidad.
      sql`(${bookings.status} = 'paid' OR (${bookings.status} = 'pending' AND ${bookings.expiresAt} > now()))`,
    ))
    .orderBy(asc(bookings.time), asc(bookings.createdAt))
}

/** Detalle de un día para el panel: horarios efectivos + quiénes vienen. */
export async function detalleDia(date: string) {
  const [cerrado] = await db.select().from(closedDates).where(eq(closedDates.date, date))
  const propios = await db.select().from(dateSlots).where(eq(dateSlots.date, date))
  const plantilla = await db.select().from(weeklySlots)
    .where(eq(weeklySlots.weekday, weekdayDe(date)))

  const base = propios.length ? propios : plantilla
  const reservas = await reservasVivas(date)

  return {
    date,
    closed: Boolean(cerrado),
    custom: propios.length > 0,
    slots: base
      .map((s) => ({
        time: s.time,
        seats: s.seats,
        priceUsd: s.priceUsd,
        priceArs: s.priceArs,
        classPriceUsd: s.classPriceUsd,
        classPriceArs: s.classPriceArs,
        vendidos: reservas
          .filter((r) => r.time === s.time && r.status === 'paid')
          .reduce((n, r) => n + r.seats, 0),
      }))
      .sort((a, b) => a.time.localeCompare(b.time)),
    reservas,
  }
}

/** Cuántos asientos PAGADOS hay ese día. Es el número que bloquea cerrar o achicar. */
async function asientosPagados(date: string): Promise<number> {
  const [r] = await db
    .select({ n: sql<number>`COALESCE(SUM(${bookings.seats}),0)::int` })
    .from(bookings)
    .where(and(eq(bookings.date, date), eq(bookings.status, 'paid')))
  return Number(r?.n ?? 0)
}

/**
 * Cierra un día entero.
 *
 * Se niega si ya hay reservas pagadas: cambiar la disponibilidad nunca puede invalidar
 * algo que alguien ya pagó. Cancelar esas reservas tiene que ser una acción explícita
 * y aparte, nunca el efecto colateral de mover un switch.
 */
export async function cerrarDia(date: string, reason?: string) {
  const pagados = await asientosPagados(date)
  if (pagados > 0) {
    return { ok: false as const, error: 'con_reservas', pagados }
  }

  await db.transaction(async (tx) => {
    await tx.insert(closedDates).values({ date, reason: reason ?? null })
      .onConflictDoUpdate({ target: closedDates.date, set: { reason: reason ?? null } })
    await tx.delete(dateSlots).where(eq(dateSlots.date, date))
  })

  revalidatePath('/admin')
  return { ok: true as const }
}

/** Vuelve a abrir un día cerrado. Queda heredando la plantilla semanal. */
export async function abrirDia(date: string) {
  await db.delete(closedDates).where(eq(closedDates.date, date))
  revalidatePath('/admin')
  return { ok: true as const }
}

/**
 * Define horarios propios para una fecha, que reemplazan la plantilla de ese día.
 * Se niega si dejaría menos lugares de los ya vendidos en algún horario.
 */
export async function guardarDia(date: string, slots: SlotEntrada[]) {
  const filas = slots
    .filter((s) => /^\d{2}:\d{2}$/.test(s.time))
    .map((s) => ({
      date,
      time: `${s.time}:00`,
      seats: Math.max(1, Math.min(200, Math.trunc(s.seats) || 1)),
      priceUsd: aCentavos(s.priceUsd),
      priceArs: aCentavos(s.priceArs),
      classPriceUsd: aCentavos(s.classPriceUsd),
      classPriceArs: aCentavos(s.classPriceArs),
    }))

  const vendidosPorHora = new Map<string, number>()
  for (const r of await reservasVivas(date)) {
    if (r.status !== 'paid') continue
    vendidosPorHora.set(r.time, (vendidosPorHora.get(r.time) ?? 0) + r.seats)
  }

  for (const [time, vendidos] of vendidosPorHora) {
    const fila = filas.find((f) => f.time === time)
    if (!fila) return { ok: false as const, error: 'horario_con_reservas', time, vendidos }
    if (fila.seats < vendidos) {
      return { ok: false as const, error: 'menos_lugares_que_vendidos', time, vendidos }
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(closedDates).where(eq(closedDates.date, date))
    await tx.delete(dateSlots).where(eq(dateSlots.date, date))
    if (filas.length) await tx.insert(dateSlots).values(filas)
  })

  revalidatePath('/admin')
  return { ok: true as const }
}

/** Descarta las excepciones de la fecha: vuelve a heredar la semana habitual. */
export async function volverALoNormal(date: string) {
  await db.transaction(async (tx) => {
    await tx.delete(dateSlots).where(eq(dateSlots.date, date))
    await tx.delete(closedDates).where(eq(closedDates.date, date))
  })
  revalidatePath('/admin')
  return { ok: true as const }
}

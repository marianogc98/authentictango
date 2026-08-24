import { and, eq, ne, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { bookings, closedDates, dateSlots, weeklySlots } from '@/lib/db/schema'
import { weekdayDe } from './tiempo'

export type Proveedor = 'paypal' | 'mercadopago'

export type Confirmacion =
  | { ok: true; yaEstaba: boolean; overbooked?: false }
  /** Se cobró, pero el lugar ya no está: hay que reembolsar. */
  | { ok: true; yaEstaba: false; overbooked: true }
  | { ok: false; reason: 'no_existe' | 'importe_no_coincide' | 'otro_pago' }

/**
 * Marca una reserva como pagada.
 *
 * Se llama desde dos lados —la captura del checkout y, más adelante, el webhook— y las
 * pasarelas reintentan sus webhooks, así que tiene que ser idempotente: llamarla dos
 * veces con el mismo pago no puede cobrar ni duplicar nada.
 *
 * El importe se valida contra lo guardado en la reserva, nunca contra lo que manda el
 * cliente: si no coincide, no se confirma.
 */
export async function confirmarPago(params: {
  uid: string
  provider: Proveedor
  providerRef: string
  amountCentavos: number
  currency: string
}): Promise<Confirmacion> {
  return db.transaction(async (tx) => {
    const [reserva] = await tx.select().from(bookings).where(eq(bookings.uid, params.uid))
    if (!reserva) return { ok: false as const, reason: 'no_existe' as const }

    // Idempotencia: el mismo pago llegando de nuevo no hace nada.
    if (reserva.status === 'paid') {
      if (reserva.providerRef === params.providerRef) {
        return { ok: true as const, yaEstaba: true }
      }
      // Pagada, pero con otra referencia: dos cobros por la misma reserva.
      console.error(
        `[confirmar] ${params.uid} ya estaba pagada con ${reserva.providerRef}, ` +
        `llegó ${params.providerRef}. Hay que revisar y reembolsar uno.`,
      )
      return { ok: false as const, reason: 'otro_pago' as const }
    }

    if (reserva.amount !== params.amountCentavos || reserva.currency !== params.currency) {
      console.error(
        `[confirmar] ${params.uid}: se esperaba ${reserva.amount} ${reserva.currency} ` +
        `y llegó ${params.amountCentavos} ${params.currency}.`,
      )
      return { ok: false as const, reason: 'importe_no_coincide' as const }
    }

    // Mismo lock que al tomar los asientos: acá se decide si el lugar sigue existiendo.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`${reserva.date}T${reserva.time}`}))`)

    const capacidad = await capacidadDe(tx, reserva.date, reserva.time)

    const [{ tomados }] = await tx
      .select({ tomados: sql<number>`COALESCE(SUM(${bookings.seats}), 0)::int` })
      .from(bookings)
      .where(and(
        eq(bookings.date, reserva.date),
        eq(bookings.time, reserva.time),
        ne(bookings.uid, reserva.uid),
        sql`(${bookings.status} = 'paid' OR (${bookings.status} = 'pending' AND ${bookings.expiresAt} > now()))`,
      ))

    // El pago llegó tarde y el lugar ya se revendió. Es raro con 20 minutos de hold,
    // pero cuando pasa hay que enterarse ahora y no el día del tour.
    const sinLugar = capacidad === null || Number(tomados) + reserva.seats > capacidad

    await tx
      .update(bookings)
      .set({
        status: sinLugar ? 'overbooked' : 'paid',
        provider: params.provider,
        providerRef: params.providerRef,
        paidAt: sql`now()`,
      })
      .where(eq(bookings.uid, params.uid))

    if (sinLugar) {
      console.error(
        `[confirmar] ${params.uid} se cobró pero el lugar ya no está ` +
        `(${reserva.date} ${reserva.time}). Marcada overbooked: hay que reembolsar.`,
      )
      return { ok: true as const, yaEstaba: false, overbooked: true as const }
    }

    return { ok: true as const, yaEstaba: false }
  })
}

/** Lugares del slot según la misma precedencia que la disponibilidad. null = ya no existe. */
async function capacidadDe(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  date: string,
  time: string,
): Promise<number | null> {
  const [cerrado] = await tx.select().from(closedDates).where(eq(closedDates.date, date))
  if (cerrado) return null

  const propios = await tx.select().from(dateSlots).where(eq(dateSlots.date, date))
  if (propios.length) return propios.find((s) => s.time === time)?.seats ?? null

  const [semanal] = await tx.select().from(weeklySlots).where(and(
    eq(weeklySlots.weekday, weekdayDe(date)),
    eq(weeklySlots.time, time),
  ))
  return semanal?.seats ?? null
}

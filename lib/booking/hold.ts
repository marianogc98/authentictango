import { randomUUID } from 'node:crypto'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { bookings, closedDates, dateSlots, weeklySlots } from '@/lib/db/schema'
import { weekdayDe, yaPaso } from './tiempo'
import { dentroDeVentana, getVentana } from './ventana'

/** Minutos que los asientos quedan reservados esperando el pago. */
export const HOLD_MINUTOS = 20

/** Holds sin pagar que puede tener una misma IP a la vez. */
const HOLDS_POR_IP = 5

export type Moneda = 'USD' | 'ARS'

export type HoldInput = {
  date: string
  time: string
  seats: number
  name: string
  email: string
  phone?: string | null
  locale: string
  currency: Moneda
  /** El tour con la clase grupal. El extra se cobra por persona. */
  withClass?: boolean
  ip?: string | null
}

export type HoldResult =
  | { ok: true; uid: string; amount: number; currency: Moneda }
  | {
      ok: false
      reason:
        | 'cerrado' | 'sin_horario' | 'pasado' | 'sin_lugar' | 'sin_precio'
        | 'sin_clase' | 'demasiados' | 'fuera_de_ventana'
      seatsLeft?: number
    }

/**
 * Toma asientos para una reserva y devuelve el importe a cobrar.
 *
 * Todo corre dentro de una transacción con un lock por slot. Sin ese lock, dos personas
 * comprando los últimos dos lugares al mismo tiempo leen "quedan 2" antes de que
 * cualquiera inserte, y las dos compran. Funciona el 99% de las veces y falla justo
 * cuando el tour se llena, que es cuando más caro sale.
 *
 * `pg_advisory_xact_lock` se libera solo al terminar la transacción, con commit o con
 * rollback: no hay forma de dejar el slot trabado por un error.
 */
export async function holdSeats(input: HoldInput): Promise<HoldResult> {
  if (input.seats < 1) return { ok: false, reason: 'sin_lugar', seatsLeft: 0 }
  if (yaPaso(input.date, input.time)) return { ok: false, reason: 'pasado' }

  // La ventana se chequea acá y no sólo en el calendario público: el POST se puede armar
  // a mano, y una fecha fuera de la ventana tiene que rebotar igual que un día cerrado.
  if (!dentroDeVentana(input.date, await getVentana())) {
    return { ok: false, reason: 'fuera_de_ventana' }
  }

  // Un hold bloquea asientos 20 minutos sin haber pagado nada. Sin este freno, un script
  // puede llenar el calendario y dejar el tour sin poder venderse.
  if (input.ip) {
    const [{ n }] = await db
      .select({ n: sql<number>`COUNT(*)::int` })
      .from(bookings)
      .where(and(
        eq(bookings.ip, input.ip),
        eq(bookings.status, 'pending'),
        sql`${bookings.expiresAt} > now()`,
      ))
    if (Number(n) >= HOLDS_POR_IP) return { ok: false, reason: 'demasiados' }
  }

  return db.transaction(async (tx) => {
    // Serializa a todos los que compiten por este mismo slot, y sólo por éste.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`${input.date}T${input.time}`}))`)

    const [cerrado] = await tx.select().from(closedDates).where(eq(closedDates.date, input.date))
    if (cerrado) return { ok: false, reason: 'cerrado' as const }

    // Misma precedencia que en la disponibilidad: los horarios propios de la fecha
    // reemplazan la plantilla semanal por completo.
    const propios = await tx.select().from(dateSlots).where(eq(dateSlots.date, input.date))
    const slot = propios.length
      ? propios.find((s) => s.time === input.time)
      : (
          await tx.select().from(weeklySlots).where(and(
            eq(weeklySlots.weekday, weekdayDe(input.date)),
            eq(weeklySlots.time, input.time),
          ))
        )[0]

    if (!slot) return { ok: false, reason: 'sin_horario' as const }

    const precioTour = input.currency === 'USD' ? slot.priceUsd : slot.priceArs
    // Un horario sin precio no se vende. Es preferible no poder reservar a reservar gratis.
    if (precioTour <= 0) return { ok: false, reason: 'sin_precio' as const }

    // El extra sale del slot, nunca del cliente: lo único que manda el navegador es el
    // booleano. Si pidió clase en un horario que no la ofrece, rebota en vez de cobrarle
    // el tour solo: pediría una cosa y compraría otra.
    const precioClase = input.currency === 'USD' ? slot.classPriceUsd : slot.classPriceArs
    if (input.withClass && precioClase <= 0) return { ok: false, reason: 'sin_clase' as const }

    const precioUnitario = precioTour + (input.withClass ? precioClase : 0)

    const [{ tomados }] = await tx
      .select({
        tomados: sql<number>`COALESCE(SUM(${bookings.seats}), 0)::int`,
      })
      .from(bookings)
      .where(and(
        eq(bookings.date, input.date),
        eq(bookings.time, input.time),
        sql`(${bookings.status} = 'paid' OR (${bookings.status} = 'pending' AND ${bookings.expiresAt} > now()))`,
      ))

    const libres = slot.seats - Number(tomados)
    if (input.seats > libres) {
      return { ok: false, reason: 'sin_lugar' as const, seatsLeft: Math.max(0, libres) }
    }

    const amount = precioUnitario * input.seats
    const uid = randomUUID()

    await tx.insert(bookings).values({
      uid,
      date: input.date,
      time: input.time,
      seats: input.seats,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      locale: input.locale,
      withClass: Boolean(input.withClass),
      ip: input.ip ?? null,
      status: 'pending',
      amount,
      currency: input.currency,
      expiresAt: sql`now() + interval '${sql.raw(String(HOLD_MINUTOS))} minutes'`,
    })

    return { ok: true as const, uid, amount, currency: input.currency }
  })
}

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { bookings } from '@/lib/db/schema'

export type ReservaPublica = {
  uid: string
  date: string
  time: string
  seats: number
  withClass: boolean
  name: string
  email: string
  status: string
  amount: number | null
  currency: string | null
  expiresAt: Date
  locale: string
  /** El hold venció aunque el registro todavía diga pending: se calcula, no se confía. */
  vencida: boolean
}

/**
 * Busca una reserva por su uid público.
 *
 * No expone el id incremental ni el teléfono ni la IP: esta página la abre cualquiera
 * que tenga el link, así que sólo devuelve lo necesario para pagar y confirmar.
 */
export async function getReserva(uid: string): Promise<ReservaPublica | null> {
  if (!/^[0-9a-f-]{36}$/i.test(uid)) return null

  const [r] = await db
    .select({
      uid: bookings.uid, date: bookings.date, time: bookings.time, seats: bookings.seats,
      withClass: bookings.withClass,
      name: bookings.name, email: bookings.email, status: bookings.status,
      amount: bookings.amount, currency: bookings.currency,
      expiresAt: bookings.expiresAt, locale: bookings.locale,
    })
    .from(bookings)
    .where(eq(bookings.uid, uid))

  if (!r) return null

  return {
    ...r,
    vencida: r.status === 'pending' && r.expiresAt.getTime() <= Date.now(),
  }
}

/**
 * Versión completa, sólo para uso interno del servidor: incluye el teléfono, que la
 * organizadora necesita en el aviso pero no tiene por qué viajar al navegador.
 */
export async function getReservaInterna(uid: string) {
  if (!/^[0-9a-f-]{36}$/i.test(uid)) return null
  const [r] = await db.select().from(bookings).where(eq(bookings.uid, uid))
  return r ?? null
}

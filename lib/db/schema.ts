import { sql } from 'drizzle-orm'
import {
  pgTable, serial, integer, text, date, time, timestamp,
  primaryKey, index, uniqueIndex,
} from 'drizzle-orm/pg-core'

/**
 * Todo el dominio se apoya en dos reglas:
 *   - `weekly_slots` es la semana habitual: se configura una vez y casi no se toca.
 *   - `closed_dates` y `date_slots` son las excepciones, y sólo guardan lo excepcional.
 *
 * Fechas y horas se guardan sin zona horaria a propósito: el tour es SIEMPRE a la hora
 * de Buenos Aires. Guardar un timestamp con zona invitaría a interpretarlo en la del
 * visitante, que es justo lo que no queremos.
 *
 * Los precios van en centavos como enteros. Nunca float: 0.1 + 0.2 !== 0.3 y con plata
 * eso termina en un centavo que no cierra.
 */

/** La semana habitual. Varias filas por día si hay más de un horario. */
export const weeklySlots = pgTable(
  'weekly_slots',
  {
    weekday: integer('weekday').notNull(), // 0 = domingo … 6 = sábado
    time: time('time').notNull(),
    seats: integer('seats').notNull().default(10),
    priceUsd: integer('price_usd').notNull().default(0),
    priceArs: integer('price_ars').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.weekday, t.time] })],
)

/** Días cerrados completos: vacaciones, feriados. */
export const closedDates = pgTable('closed_dates', {
  date: date('date').primaryKey(),
  reason: text('reason'),
})

/** Horarios propios de una fecha. Si hay filas, reemplazan la plantilla de esa fecha. */
export const dateSlots = pgTable(
  'date_slots',
  {
    date: date('date').notNull(),
    time: time('time').notNull(),
    seats: integer('seats').notNull(),
    priceUsd: integer('price_usd').notNull(),
    priceArs: integer('price_ars').notNull(),
  },
  (t) => [primaryKey({ columns: [t.date, t.time] })],
)

/**
 * Estados posibles de `status`:
 *   pending    — asientos tomados, esperando el pago (vence en `expiresAt`)
 *   paid       — cobrado y confirmado
 *   expired    — el hold venció sin pago; los asientos se liberaron
 *   cancelled  — cancelada por ella desde el panel
 *   overbooked — el pago se aprobó tarde y el lugar ya se había revendido: hay que reembolsar
 */
export const bookings = pgTable(
  'bookings',
  {
    id: serial('id').primaryKey(),
    /** Identificador público, el que viaja en la URL. No se expone el id incremental. */
    uid: text('uid').notNull().unique(),

    date: date('date').notNull(),
    time: time('time').notNull(),
    seats: integer('seats').notNull(),

    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    locale: text('locale').notNull().default('en'),

    status: text('status').notNull().default('pending'),

    provider: text('provider'), // 'paypal' | 'mercadopago'
    /** Id de la orden/pago en la pasarela. Es la clave de idempotencia del webhook. */
    providerRef: text('provider_ref'),

    /** Importe efectivamente cobrado, congelado al reservar: si mañana cambia el precio,
     *  la reserva vieja tiene que seguir diciendo lo que se pagó. */
    amount: integer('amount'),
    currency: text('currency'), // 'USD' | 'ARS'

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
  },
  (t) => [
    index('bookings_slot_idx').on(t.date, t.time),
    index('bookings_status_idx').on(t.status),
    // Postgres permite varios NULL en un índice único, así que las reservas todavía sin
    // pago no chocan entre sí. En cuanto hay provider_ref, el webhook no puede duplicar.
    uniqueIndex('bookings_provider_ref_idx').on(t.provider, t.providerRef),
  ],
)

/** Cuántos asientos de un slot están comprometidos: pagados, o con hold vigente. */
export const asientosTomados = sql`
  COALESCE(SUM(CASE WHEN status = 'paid' OR (status = 'pending' AND expires_at > now())
                    THEN seats ELSE 0 END), 0)
`

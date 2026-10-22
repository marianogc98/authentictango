import { sql } from 'drizzle-orm'
import {
  pgTable, serial, integer, boolean, text, date, time, timestamp,
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
 *
 * Cada horario vende dos experiencias independientes: el tour solo (`price_*`) y el tour
 * con clase grupal (`class_price_*`). Cada una lleva su propio precio POR PERSONA, y un
 * precio en cero significa que esa experiencia no se vende a esa hora. Se puede ofrecer
 * una sin la otra: un horario sólo de clase grupal es un horario con `price = 0`.
 *
 * Las dos comparten los asientos del horario, y por eso viajan como dos precios de la
 * misma fila y no como filas aparte: es una sola salida a esa hora, con una sola cuenta
 * de lugares. Con una fila por producto, el mismo cupo se vendería dos veces.
 */

/** La semana habitual. Varias filas por día si hay más de un horario. */
export const weeklySlots = pgTable(
  'weekly_slots',
  {
    weekday: integer('weekday').notNull(), // 0 = domingo … 6 = sábado
    time: time('time').notNull(),
    seats: integer('seats').notNull().default(10),
    /** Precio POR PERSONA del tour solo. 0 = ese horario no vende el tour solo. */
    priceUsd: integer('price_usd').notNull().default(0),
    priceArs: integer('price_ars').notNull().default(0),
    /** Precio POR PERSONA del tour con clase grupal. 0 = ese horario no la vende. */
    classPriceUsd: integer('class_price_usd').notNull().default(0),
    classPriceArs: integer('class_price_ars').notNull().default(0),
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
    /** Precio POR PERSONA del tour solo. 0 = ese horario no vende el tour solo. */
    priceUsd: integer('price_usd').notNull(),
    priceArs: integer('price_ars').notNull(),
    /** Precio POR PERSONA del tour con clase grupal. 0 = ese horario no la vende. */
    classPriceUsd: integer('class_price_usd').notNull().default(0),
    classPriceArs: integer('class_price_ars').notNull().default(0),
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

    /** Cuál de las dos experiencias compraron: false = tour solo, true = tour con clase
     *  grupal. El precio ya está dentro de `amount`; esto queda para saber qué compraron:
     *  el mail, el panel y cuánta gente espera la clase. */
    withClass: boolean('with_class').notNull().default(false),

    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    locale: text('locale').notNull().default('en'),

    /** Código del link de referido por el que entró (su `utm_source`), si entró por uno.
     *  El descuento ya está aplicado en `amount`; esto queda para saber a quién se le
     *  debe cada venta. */
    referral: text('referral'),

    /** Sólo para limitar abuso: un bot podría crear holds hasta llenar el calendario. */
    ip: text('ip'),

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

/**
 * Links de referidos. El `code` es el `utm_source` del link, en minúsculas.
 *
 * Cada moneda tiene su propio porcentaje, igual que su propio precio: 0 en una moneda
 * significa que pagando así no hay descuento, pero la venta igual queda anotada a su
 * nombre. Desactivar un referido corta el descuento aunque el visitante ya tenga la
 * cookie; no se borra porque las reservas viejas lo siguen nombrando.
 */
export const referrals = pgTable('referrals', {
  code: text('code').primaryKey(),
  percentUsd: integer('percent_usd').notNull().default(0),
  percentArs: integer('percent_ars').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Cuántos asientos de un slot están comprometidos: pagados, o con hold vigente. */
export const asientosTomados = sql`
  COALESCE(SUM(CASE WHEN status = 'paid' OR (status = 'pending' AND expires_at > now())
                    THEN seats ELSE 0 END), 0)
`

/**
 * La ventana de reservas: entre qué fechas se acepta reservar desde la web.
 *
 * Es una sola fila: siempre se escribe con id = 1 y un upsert sobre esa clave, así que
 * no hay forma de que existan dos ventanas compitiendo. Si no hay fila, o las dos
 * columnas están en null, no hay ventana y vale la regla de siempre.
 *
 * Es independiente de la plantilla semanal a propósito: apagar la venta hasta marzo no
 * tiene por qué hacerle perder los horarios que ya tenía cargados. `start_date` en null
 * significa "desde hoy", y `end_date` en null, "sin fecha de corte".
 */
export const bookingWindow = pgTable('booking_window', {
  id: integer('id').primaryKey().default(1),
  startDate: date('start_date'),
  endDate: date('end_date'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * Las reseñas de la home, que ella carga desde el panel.
 *
 * Cada una guarda su texto en los dos idiomas en la misma fila: es la misma reseña
 * traducida, y con una fila por idioma se podría borrar una y dejar huérfana la otra.
 *
 * `date` es el mes de la reseña —se guarda el día 1— y es también el orden: la más nueva
 * primero. `visible` permite sacarla de la web sin perder el texto.
 */
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  rating: integer('rating').notNull().default(5),
  date: date('date').notNull(),
  textEs: text('text_es').notNull(),
  textEn: text('text_en').notNull(),
  visible: boolean('visible').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * Las fotos de la galería, en el orden de `position` (la primera sale grande).
 *
 * `src` es la ruta pública tal cual: '/images/…' para las que vinieron con el sitio y
 * '/media/…' para las que ella sube desde el panel, que viven en el volumen. Guardar la
 * ruta y no sólo el nombre del archivo deja convivir a las dos sin casos especiales.
 */
export const galleryImages = pgTable('gallery_images', {
  id: serial('id').primaryKey(),
  src: text('src').notNull(),
  altEs: text('alt_es').notNull().default(''),
  altEn: text('alt_en').notNull().default(''),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

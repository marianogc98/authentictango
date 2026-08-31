import { and, desc, eq, gte, lte, or, ilike, sql, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { bookings } from '@/lib/db/schema'
import { TZ } from '@/lib/booking/tiempo'

/**
 * El listado histórico de reservas: lo que el calendario no puede contestar.
 *
 * El calendario mira para adelante y sólo muestra lo vivo. Acá se mira para atrás:
 * qué se vendió, a quién, cuándo se cobró y qué quedó en el camino.
 */

export type Estado = 'todas' | 'paid' | 'pending' | 'expired' | 'cancelled' | 'overbooked'
export type Orden = 'tour' | 'pago'

export type Filtros = {
  estado: Estado
  desde: string | null
  hasta: string | null
  q: string
  orden: Orden
  pagina: number
}

export const POR_PAGINA = 50

/** Tope de la exportación. Sin límite, un CSV podría intentar traer la tabla entera. */
const TOPE_CSV = 5000

const ESTADOS: Estado[] = ['todas', 'paid', 'pending', 'expired', 'cancelled', 'overbooked']
const FECHA = /^\d{4}-\d{2}-\d{2}$/
const UUID = /^[0-9a-f-]{36}$/i

/**
 * El estado que hay que mostrar, que no siempre es el guardado.
 *
 * Un hold vencido sigue diciendo 'pending' en la base hasta que `expirarHolds` pase por
 * ahí. Igual que en la disponibilidad y en el panel del día, el vencimiento se calcula
 * en la consulta en vez de confiar en la columna.
 */
const estadoEfectivo = sql<string>`
  CASE WHEN ${bookings.status} = 'pending' AND ${bookings.expiresAt} <= now()
       THEN 'expired' ELSE ${bookings.status} END
`

/** La fecha de pago en el calendario de Buenos Aires, que es el único que se usa acá. */
const fechaDePago = sql`(${bookings.paidAt} AT TIME ZONE ${TZ})::date`

/** Lee los filtros del querystring. Todo lo que no entienda cae al valor por defecto. */
export function parseFiltros(sp: Record<string, string | string[] | undefined>): Filtros {
  const uno = (k: string): string => {
    const v = sp[k]
    return (Array.isArray(v) ? v[0] : v) ?? ''
  }

  const estado = uno('estado')
  const desde = uno('desde')
  const hasta = uno('hasta')
  const pagina = Number(uno('p'))

  return {
    estado: (ESTADOS as string[]).includes(estado) ? (estado as Estado) : 'todas',
    desde: FECHA.test(desde) ? desde : null,
    hasta: FECHA.test(hasta) ? hasta : null,
    q: uno('q').trim().slice(0, 120),
    orden: uno('orden') === 'pago' ? 'pago' : 'tour',
    pagina: Number.isInteger(pagina) && pagina > 1 ? pagina : 1,
  }
}

function condiciones(f: Filtros): SQL | undefined {
  const partes: SQL[] = []

  // Sin filtro explícito, las vencidas no se muestran: son holds que nadie pagó y
  // ensucian todo lo demás. Se ven eligiendo "Vencidas" a propósito.
  partes.push(
    f.estado === 'todas'
      ? sql`${estadoEfectivo} <> 'expired'`
      : sql`${estadoEfectivo} = ${f.estado}`,
  )

  // El rango se aplica sobre la misma fecha por la que se ordena: filtrar por fecha del
  // tour mientras se ordena por fecha de pago daría una lista imposible de leer.
  const columna = f.orden === 'pago' ? fechaDePago : sql`${bookings.date}`
  if (f.desde) partes.push(sql`${columna} >= ${f.desde}`)
  if (f.hasta) partes.push(sql`${columna} <= ${f.hasta}`)

  if (f.q) {
    // Un uid es una búsqueda exacta: viene de un link o de un mail, no se tipea a mano.
    partes.push(
      UUID.test(f.q)
        ? eq(bookings.uid, f.q)
        : (or(
            ilike(bookings.name, `%${f.q}%`),
            ilike(bookings.email, `%${f.q}%`),
            ilike(bookings.phone, `%${f.q}%`),
          ) as SQL),
    )
  }

  return and(...partes)
}

function orden(f: Filtros) {
  return f.orden === 'pago'
    ? [sql`${bookings.paidAt} DESC NULLS LAST`, desc(bookings.createdAt)]
    : [desc(bookings.date), desc(bookings.time), desc(bookings.createdAt)]
}

const COLUMNAS = {
  uid: bookings.uid,
  date: bookings.date,
  time: bookings.time,
  seats: bookings.seats,
  withClass: bookings.withClass,
  name: bookings.name,
  email: bookings.email,
  phone: bookings.phone,
  amount: bookings.amount,
  currency: bookings.currency,
  provider: bookings.provider,
  providerRef: bookings.providerRef,
  createdAt: bookings.createdAt,
  paidAt: bookings.paidAt,
  estado: estadoEfectivo,
}

export type Reserva = {
  uid: string
  date: string
  time: string
  seats: number
  withClass: boolean
  name: string
  email: string
  phone: string | null
  amount: number | null
  currency: string | null
  provider: string | null
  providerRef: string | null
  createdAt: Date
  paidAt: Date | null
  estado: string
}

export type Totales = {
  /** Cuántas reservas entran en el filtro, más allá de la página que se esté viendo. */
  reservas: number
  personas: number
  /** Sólo lo efectivamente cobrado. Las dos monedas van separadas: no hay conversión. */
  usd: number
  ars: number
}

export type Listado = {
  filas: Reserva[]
  totales: Totales
  paginas: number
  /** Pagos aprobados tarde sobre un lugar ya revendido. Hay que devolver esa plata. */
  aReembolsar: number
}

export async function listarReservas(f: Filtros): Promise<Listado> {
  const where = condiciones(f)

  const [filas, [agregado], [pendientes]] = await Promise.all([
    db.select(COLUMNAS).from(bookings)
      .where(where)
      .orderBy(...orden(f))
      .limit(POR_PAGINA)
      .offset((f.pagina - 1) * POR_PAGINA),

    db.select({
      reservas: sql<number>`COUNT(*)::int`,
      personas: sql<number>`COALESCE(SUM(${bookings.seats}), 0)::int`,
      usd: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.status} = 'paid' AND ${bookings.currency} = 'USD' THEN ${bookings.amount} ELSE 0 END), 0)::int`,
      ars: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.status} = 'paid' AND ${bookings.currency} = 'ARS' THEN ${bookings.amount} ELSE 0 END), 0)::int`,
    }).from(bookings).where(where),

    // Fuera del filtro a propósito: es plata que hay que devolver, y tiene que avisar
    // aunque estés mirando otro mes.
    db.select({ n: sql<number>`COUNT(*)::int` })
      .from(bookings)
      .where(eq(bookings.status, 'overbooked')),
  ])

  const totales: Totales = {
    reservas: Number(agregado?.reservas ?? 0),
    personas: Number(agregado?.personas ?? 0),
    usd: Number(agregado?.usd ?? 0),
    ars: Number(agregado?.ars ?? 0),
  }

  return {
    filas: filas as Reserva[],
    totales,
    paginas: Math.max(1, Math.ceil(totales.reservas / POR_PAGINA)),
    aReembolsar: Number(pendientes?.n ?? 0),
  }
}

/** Todo lo que entra en el filtro, sin paginar, para exportar. */
export async function reservasParaCsv(f: Filtros): Promise<Reserva[]> {
  const filas = await db.select(COLUMNAS).from(bookings)
    .where(condiciones(f))
    .orderBy(...orden(f))
    .limit(TOPE_CSV)
  return filas as Reserva[]
}

/** Rango de fechas sugerido cuando no hay filtro: útil para el nombre del archivo. */
export function describirFiltro(f: Filtros): string {
  const partes = [
    f.estado === 'todas' ? null : f.estado,
    f.desde ? `desde-${f.desde}` : null,
    f.hasta ? `hasta-${f.hasta}` : null,
  ].filter(Boolean)
  return partes.length ? partes.join('-') : 'todas'
}

/** Deja el rango vacío pero con el resto de los filtros intactos. */
export function aQuerystring(f: Partial<Filtros>): string {
  const p = new URLSearchParams()
  if (f.estado && f.estado !== 'todas') p.set('estado', f.estado)
  if (f.desde) p.set('desde', f.desde)
  if (f.hasta) p.set('hasta', f.hasta)
  if (f.q) p.set('q', f.q)
  if (f.orden && f.orden !== 'tour') p.set('orden', f.orden)
  if (f.pagina && f.pagina > 1) p.set('p', String(f.pagina))
  return p.toString()
}

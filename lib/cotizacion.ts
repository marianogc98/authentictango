/**
 * La cotización del dólar blue, que es lo que convierte el precio en dólares —el único
 * que ella carga— al precio en pesos que se cobra por Mercado Pago.
 *
 * Dos fuentes, en orden: DolarAPI primero y Bluelytics como respaldo. No están acá por
 * gusto sino porque son las dos que responden JSON público, sin clave y con CORS abierto;
 * si una se cae, la otra alcanza para seguir vendiendo. Se consultan desde el servidor y
 * nunca desde el navegador: el precio que se muestra tiene que ser el mismo que después
 * se cobra, y eso sólo se garantiza si lo calcula un solo lado.
 *
 * El valor se cachea en memoria del proceso. El blue se mueve en horario de mercado y
 * unos pesos arriba o abajo no cambian nada en un tour de USD 50, así que refrescar cada
 * media hora alcanza de sobra y evita golpear APIs gratuitas de terceros en cada visita.
 *
 * Si las dos fuentes fallan se devuelve la última cotización conocida aunque esté vencida:
 * un precio de hace unas horas es infinitamente mejor que no poder vender. Recién cuando
 * tampoco hay nada viejo se devuelve null, y ahí el precio en pesos cae al último valor
 * que quedó guardado en la base al configurar el horario.
 */

export type Cotizacion = {
  /** Pesos por dólar, punta vendedora. Es la que se usa para cobrar. */
  venta: number
  compra: number
  fuente: 'dolarapi' | 'bluelytics'
  /** Cuándo la actualizó la fuente, no cuándo la pedimos nosotros. */
  actualizado: string
}

/** Cada cuánto se vuelve a preguntar el valor. */
const FRESCA_MS = 30 * 60 * 1000

/** Hasta cuándo sirve una cotización vieja si las fuentes no responden. */
const RANCIA_MS = 24 * 60 * 60 * 1000

/** Cuánto se espera a cada fuente antes de pasar a la siguiente. */
const TIMEOUT_MS = 4000

/**
 * Rango de cordura. No es para adivinar el valor real: es para descartar una respuesta
 * rota —un 0, un null que se volvió NaN, un HTML de error parseado como número— antes de
 * que se convierta en un precio absurdo cobrado de verdad.
 */
const MINIMO = 100
const MAXIMO = 5_000_000

let cache: { valor: Cotizacion; tomada: number } | null = null
/** Un solo pedido en vuelo: diez visitas simultáneas no tienen que ser diez fetch. */
let enVuelo: Promise<Cotizacion | null> | null = null

function valida(compra: unknown, venta: unknown): boolean {
  const c = Number(compra)
  const v = Number(venta)
  return (
    Number.isFinite(c) && Number.isFinite(v) &&
    v >= MINIMO && v <= MAXIMO &&
    c > 0 && c <= v
  )
}

async function pedirJson(url: string): Promise<unknown> {
  const r = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { accept: 'application/json' },
    cache: 'no-store',
  })
  if (!r.ok) throw new Error(`${url} -> ${r.status}`)
  return r.json()
}

async function dolarapi(): Promise<Cotizacion | null> {
  const d = (await pedirJson('https://dolarapi.com/v1/dolares/blue')) as {
    compra?: unknown; venta?: unknown; fechaActualizacion?: unknown
  }
  if (!valida(d.compra, d.venta)) return null
  return {
    compra: Number(d.compra),
    venta: Number(d.venta),
    fuente: 'dolarapi',
    actualizado: typeof d.fechaActualizacion === 'string'
      ? d.fechaActualizacion
      : new Date().toISOString(),
  }
}

async function bluelytics(): Promise<Cotizacion | null> {
  const d = (await pedirJson('https://api.bluelytics.com.ar/v2/latest')) as {
    blue?: { value_buy?: unknown; value_sell?: unknown }
    last_update?: unknown
  }
  if (!valida(d.blue?.value_buy, d.blue?.value_sell)) return null
  return {
    compra: Number(d.blue!.value_buy),
    venta: Number(d.blue!.value_sell),
    fuente: 'bluelytics',
    actualizado: typeof d.last_update === 'string' ? d.last_update : new Date().toISOString(),
  }
}

const FUENTES = [dolarapi, bluelytics]

async function traer(): Promise<Cotizacion | null> {
  for (const fuente of FUENTES) {
    try {
      const c = await fuente()
      if (c) return c
      console.warn('[cotizacion] respuesta fuera de rango')
    } catch (err) {
      console.warn('[cotizacion]', err instanceof Error ? err.message : err)
    }
  }
  return null
}

/**
 * La cotización vigente, o null si no hay ninguna que valga la pena usar.
 *
 * Nunca tira: quien la llama tiene que poder seguir con su plan B, no romperse.
 */
export async function getCotizacion(): Promise<Cotizacion | null> {
  const ahora = Date.now()
  if (cache && ahora - cache.tomada < FRESCA_MS) return cache.valor

  if (!enVuelo) {
    enVuelo = traer().finally(() => { enVuelo = null })
  }

  const fresca = await enVuelo
  if (fresca) {
    cache = { valor: fresca, tomada: Date.now() }
    return fresca
  }

  // Las fuentes fallaron. Sirve lo viejo mientras no sea de anteayer.
  if (cache && ahora - cache.tomada < RANCIA_MS) return cache.valor
  return null
}

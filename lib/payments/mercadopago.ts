import { SITE_URL } from '@/lib/site'

/**
 * Cliente de Mercado Pago (Checkout Pro).
 *
 * A diferencia de PayPal, acá no hay handshake de OAuth: el Access Token se manda
 * directo. Y el entorno no se elige por URL — el token de una cuenta de prueba opera
 * en sandbox y el de una cuenta real cobra de verdad, contra el mismo endpoint.
 */

const BASE = 'https://api.mercadopago.com'

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN?.trim() ?? ''

export function mpConfigurado(): boolean {
  return ACCESS_TOKEN.length > 0
}

async function llamar<T>(ruta: string, init: RequestInit & { idem?: string } = {}): Promise<T> {
  const { idem, ...resto } = init

  const res = await fetch(`${BASE}${ruta}`, {
    ...resto,
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      // Evita crear dos preferencias si el navegador reintenta.
      ...(idem ? { 'X-Idempotency-Key': idem } : {}),
      ...resto.headers,
    },
    cache: 'no-store',
  })

  const texto = await res.text()
  if (!res.ok) throw new Error(`MP ${ruta} ${res.status}: ${texto}`)
  return (texto ? JSON.parse(texto) : {}) as T
}

/* ── Preferencias ─────────────────────────────────────────────────────────────── */

export type Preferencia = {
  id: string
  init_point: string
  sandbox_init_point?: string
}

/**
 * Crea la preferencia de pago y devuelve el link al que hay que mandar al comprador.
 *
 * `external_reference` lleva el uid: es lo que permite volver de un pago a su reserva,
 * tanto desde el retorno del navegador como desde el webhook.
 *
 * Los importes van en unidades, no en centavos: 7500000 centavos -> 75000 pesos.
 */
export async function crearPreferencia(params: {
  uid: string
  amountCentavos: number
  titulo: string
  seats: number
  email: string
  nombre: string
  venceEn: Date
  locale: string
}): Promise<Preferencia> {
  const volver = `${SITE_URL}/api/payments/mercadopago/return?uid=${encodeURIComponent(params.uid)}`

  return llamar<Preferencia>('/checkout/preferences', {
    method: 'POST',
    idem: `pref-${params.uid}`,
    body: JSON.stringify({
      items: [
        {
          id: params.uid,
          title: params.titulo,
          quantity: 1,
          unit_price: params.amountCentavos / 100,
          currency_id: 'ARS',
        },
      ],
      // El importe ya viene multiplicado por la cantidad de personas: se manda como un
      // solo ítem para que el total no dependa de cómo MP redondee un precio unitario.
      external_reference: params.uid,
      payer: { name: params.nombre, email: params.email },
      back_urls: { success: volver, pending: volver, failure: volver },
      auto_return: 'approved',
      notification_url: `${SITE_URL}/api/webhooks/mercadopago`,
      statement_descriptor: 'TANGO EXPERIENCE',
      // La preferencia caduca junto con el hold: si el lugar ya se liberó, no tiene
      // sentido que el link siga permitiendo pagar.
      expires: true,
      expiration_date_to: params.venceEn.toISOString(),
    }),
  })
}

/* ── Pagos ────────────────────────────────────────────────────────────────────── */

export type Pago = {
  id: number
  status: string
  status_detail?: string
  external_reference?: string
  transaction_amount?: number
  currency_id?: string
}

/** Consulta un pago. Es la única fuente de verdad: nunca se confía en el querystring. */
export async function getPago(id: string | number): Promise<Pago> {
  return llamar<Pago>(`/v1/payments/${id}`, { method: 'GET' })
}

/**
 * Cliente REST de PayPal (Orders v2).
 *
 * Sólo corre en el servidor: el secret nunca sale de acá. El Client ID sí es público
 * —viaja en el SDK del navegador— pero se lee de la misma variable para no tener el
 * dato duplicado en dos lugares.
 */

const LIVE = 'https://api-m.paypal.com'
const SANDBOX = 'https://api-m.sandbox.paypal.com'

/** Producción sólo si se pide explícitamente: por defecto, sandbox. */
export const esProduccion = process.env.PAYPAL_ENV?.trim().toLowerCase() === 'live'
const BASE = esProduccion ? LIVE : SANDBOX

export const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID?.trim() ?? ''
const PAYPAL_SECRET = process.env.PAYPAL_SECRET?.trim() ?? ''

export function paypalConfigurado(): boolean {
  return Boolean(PAYPAL_CLIENT_ID && PAYPAL_SECRET)
}

/* ── Token de acceso ──────────────────────────────────────────────────────────── */

let cache: { token: string; vence: number } | null = null

/**
 * El token de PayPal dura unas 9 horas. Se cachea en memoria con un margen de 60s
 * para no pedir uno nuevo en cada operación; si el proceso se reinicia, se vuelve a pedir.
 */
async function accessToken(): Promise<string> {
  if (cache && cache.vence > Date.now()) return cache.token

  const cred = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64')

  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${cred}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })

  if (!res.ok) {
    // El error más común acá es un desajuste de entorno: credenciales de producción
    // pegándole a sandbox (o al revés) devuelven invalid_client, que suena a clave mala.
    throw new Error(
      `PayPal auth ${res.status} contra ${esProduccion ? 'live' : 'sandbox'}: ${await res.text()} ` +
      `— si dice invalid_client, revisá que PAYPAL_ENV coincida con el tipo de credenciales.`,
    )
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  cache = { token: data.access_token, vence: Date.now() + (data.expires_in - 60) * 1000 }
  return data.access_token
}

async function llamar<T>(ruta: string, init: RequestInit & { idem?: string } = {}): Promise<T> {
  const { idem, ...resto } = init

  const res = await fetch(`${BASE}${ruta}`, {
    ...resto,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      'Content-Type': 'application/json',
      // Evita crear dos órdenes si el navegador reintenta la misma petición.
      ...(idem ? { 'PayPal-Request-Id': idem } : {}),
      ...resto.headers,
    },
    cache: 'no-store',
  })

  const texto = await res.text()
  if (!res.ok) throw new Error(`PayPal ${ruta} ${res.status}: ${texto}`)
  return (texto ? JSON.parse(texto) : {}) as T
}

/* ── Órdenes ──────────────────────────────────────────────────────────────────── */

/** Los importes viajan en unidades, con dos decimales: 5000 centavos -> "50.00". */
function aUnidades(centavos: number): string {
  return (centavos / 100).toFixed(2)
}

export type OrdenCreada = { id: string; status: string }

/**
 * Crea la orden. `custom_id` lleva el uid de la reserva: es lo que permite volver de un
 * pago a su reserva sin guardar nada intermedio, incluido desde el webhook.
 *
 * `landing_page: 'BILLING'` pide que la primera pantalla sea el formulario de tarjeta en
 * vez del login. PayPal decide igual según su scoring, así que es una mejora de tasa, no
 * una garantía: con cuenta argentina no existe forma de garantizarlo.
 */
export async function crearOrden(params: {
  uid: string
  amountCentavos: number
  currency: string
  descripcion: string
}): Promise<OrdenCreada> {
  return llamar<OrdenCreada>('/v2/checkout/orders', {
    method: 'POST',
    idem: `orden-${params.uid}`,
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          custom_id: params.uid,
          description: params.descripcion.slice(0, 127),
          amount: {
            currency_code: params.currency,
            value: aUnidades(params.amountCentavos),
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            landing_page: 'BILLING',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
          },
        },
      },
    }),
  })
}

export type CapturaResultado = {
  id: string
  status: string
  purchase_units?: Array<{
    custom_id?: string
    payments?: {
      captures?: Array<{
        id: string
        status: string
        amount: { currency_code: string; value: string }
      }>
    }
  }>
}

/** Cobra una orden ya aprobada por el comprador. */
export async function capturarOrden(orderId: string): Promise<CapturaResultado> {
  return llamar<CapturaResultado>(`/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    idem: `captura-${orderId}`,
    body: '{}',
  })
}

/** Consulta el estado de una orden sin cobrarla. */
export async function verOrden(orderId: string): Promise<CapturaResultado> {
  return llamar<CapturaResultado>(`/v2/checkout/orders/${orderId}`, { method: 'GET' })
}

/* ── Webhooks ─────────────────────────────────────────────────────────────────── */

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID?.trim() ?? ''

export function webhookConfigurado(): boolean {
  return Boolean(PAYPAL_WEBHOOK_ID)
}

/**
 * Verifica que un evento venga realmente de PayPal.
 *
 * A diferencia de Mercado Pago, acá no hay un secreto compartido para calcular un HMAC
 * localmente: PayPal firma con un certificado propio y la verificación se delega en su
 * API. Es una llamada de red extra por evento, pero es el único camino soportado.
 *
 * Sin esto, cualquiera que conozca la URL podría marcar una reserva como pagada: este
 * webhook confía en el importe que trae el evento —validado después contra la reserva—
 * y no vuelve a consultar el cobro contra la API.
 */
export async function firmaWebhookValida(raw: string, h: Headers): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID) return false

  const campos = {
    auth_algo: h.get('paypal-auth-algo') ?? '',
    cert_url: h.get('paypal-cert-url') ?? '',
    transmission_id: h.get('paypal-transmission-id') ?? '',
    transmission_sig: h.get('paypal-transmission-sig') ?? '',
    transmission_time: h.get('paypal-transmission-time') ?? '',
    webhook_id: PAYPAL_WEBHOOK_ID,
  }

  if (Object.values(campos).some((v) => !v)) return false

  // El evento se inserta tal cual llegó, sin volver a serializarlo: la firma se calculó
  // sobre esos bytes exactos y un JSON.parse + stringify puede reordenar claves o cambiar
  // el espaciado, lo que da FAILURE sobre un evento perfectamente legítimo.
  const cuerpo =
    '{' +
    Object.entries(campos)
      .map(([k, v]) => `${JSON.stringify(k)}:${JSON.stringify(v)}`)
      .join(',') +
    `,"webhook_event":${raw}}`

  try {
    const r = await llamar<{ verification_status?: string }>(
      '/v1/notifications/verify-webhook-signature',
      { method: 'POST', body: cuerpo },
    )
    return r.verification_status === 'SUCCESS'
  } catch (err) {
    // Un fallo de red acá no prueba que el evento sea falso, pero tampoco que sea real:
    // se rechaza y PayPal reintenta.
    console.error('[paypal] verificar firma:', err instanceof Error ? err.message : err)
    return false
  }
}

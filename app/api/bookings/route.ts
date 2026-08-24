import { NextResponse } from 'next/server'
import { z } from 'zod'
import { holdSeats, type Moneda } from '@/lib/booking/hold'

export const dynamic = 'force-dynamic'

const Cuerpo = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  seats: z.number().int().min(1).max(50),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().nullable(),
  locale: z.enum(['en', 'es']),
  // El método elegido decide la moneda: los dos precios son independientes, así que
  // no hay conversión posible entre uno y otro.
  method: z.enum(['paypal', 'mercadopago']),
})

const MONEDA: Record<string, Moneda> = { paypal: 'USD', mercadopago: 'ARS' }

/** La IP real detrás del proxy de Coolify. Sirve sólo para limitar abuso. */
function ipDe(request: Request): string | null {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim() || null
  return request.headers.get('x-real-ip')
}

/**
 * POST /api/bookings
 *
 * Toma los asientos y devuelve el uid con el que sigue el pago. Todavía no cobra nada:
 * el hold vence solo a los 20 minutos si no se paga.
 */
export async function POST(request: Request) {
  let datos: z.infer<typeof Cuerpo>

  try {
    datos = Cuerpo.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'datos_invalidos' }, { status: 400 })
  }

  try {
    const r = await holdSeats({
      date: datos.date,
      time: datos.time.length === 5 ? `${datos.time}:00` : datos.time,
      seats: datos.seats,
      name: datos.name,
      email: datos.email,
      phone: datos.phone ?? null,
      locale: datos.locale,
      currency: MONEDA[datos.method],
      ip: ipDe(request),
    })

    if (!r.ok) {
      // 409: el pedido era válido, pero el estado del slot cambió mientras tanto.
      return NextResponse.json(
        { error: r.reason, seatsLeft: r.seatsLeft },
        { status: r.reason === 'demasiados' ? 429 : 409 },
      )
    }

    return NextResponse.json({
      uid: r.uid,
      amount: r.amount,
      currency: r.currency,
      method: datos.method,
    })
  } catch (err) {
    console.error('[bookings] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'servidor' }, { status: 500 })
  }
}

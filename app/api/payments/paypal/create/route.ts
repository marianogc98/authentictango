import { NextResponse } from 'next/server'
import { getReservaInterna } from '@/lib/booking/consulta'
import { hhmm } from '@/lib/booking/dinero'
import { crearOrden, paypalConfigurado } from '@/lib/payments/paypal'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/paypal/create  { uid }
 *
 * Crea la orden en PayPal y devuelve su id para que el SDK abra el checkout.
 *
 * El importe sale de la base, nunca del cliente: si viniera en el cuerpo, cualquiera
 * podría pagar un dólar por un tour de cincuenta.
 */
export async function POST(request: Request) {
  if (!paypalConfigurado()) {
    return NextResponse.json({ error: 'paypal_sin_configurar' }, { status: 503 })
  }

  let uid: string
  try {
    uid = String(((await request.json()) as { uid?: unknown }).uid ?? '')
  } catch {
    return NextResponse.json({ error: 'datos_invalidos' }, { status: 400 })
  }

  const reserva = await getReservaInterna(uid)
  if (!reserva) return NextResponse.json({ error: 'no_existe' }, { status: 404 })

  if (reserva.status === 'paid') {
    return NextResponse.json({ error: 'ya_pagada' }, { status: 409 })
  }
  if (reserva.status !== 'pending' || reserva.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: 'vencida' }, { status: 409 })
  }
  if (reserva.currency !== 'USD' || !reserva.amount) {
    return NextResponse.json({ error: 'moneda_incorrecta' }, { status: 409 })
  }

  try {
    const orden = await crearOrden({
      uid: reserva.uid,
      amountCentavos: reserva.amount,
      currency: 'USD',
      descripcion: `Tango experience · ${reserva.date} ${hhmm(reserva.time)} · ${reserva.seats}p`,
    })

    return NextResponse.json({ orderID: orden.id })
  } catch (err) {
    console.error('[paypal/create]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'paypal' }, { status: 502 })
  }
}

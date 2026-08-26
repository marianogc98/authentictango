import { NextResponse } from 'next/server'
import { getReservaInterna } from '@/lib/booking/consulta'
import { hhmm } from '@/lib/booking/dinero'
import { crearPreferencia, mpConfigurado } from '@/lib/payments/mercadopago'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/mercadopago/create  { uid }
 *
 * Crea la preferencia y devuelve el link del checkout. El importe sale de la base,
 * nunca del cuerpo de la petición.
 */
export async function POST(request: Request) {
  if (!mpConfigurado()) {
    return NextResponse.json({ error: 'mp_sin_configurar' }, { status: 503 })
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
  if (reserva.currency !== 'ARS' || !reserva.amount) {
    return NextResponse.json({ error: 'moneda_incorrecta' }, { status: 409 })
  }

  try {
    const pref = await crearPreferencia({
      uid: reserva.uid,
      amountCentavos: reserva.amount,
      titulo: `Tango experience · ${reserva.date} ${hhmm(reserva.time)} · ${reserva.seats} p.`,
      seats: reserva.seats,
      email: reserva.email,
      nombre: reserva.name,
      venceEn: reserva.expiresAt,
      locale: reserva.locale,
    })

    return NextResponse.json({ url: pref.init_point, preferenceId: pref.id })
  } catch (err) {
    console.error('[mp/create]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'mercadopago' }, { status: 502 })
  }
}

import { NextResponse } from 'next/server'
import { confirmarPago } from '@/lib/booking/confirmar'
import { getReservaInterna } from '@/lib/booking/consulta'
import { enviarConfirmacion } from '@/lib/booking/emails'
import { capturarOrden, paypalConfigurado } from '@/lib/payments/paypal'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/paypal/capture  { uid, orderID }
 *
 * Cobra la orden que el comprador ya aprobó y marca la reserva como pagada.
 *
 * Este es el camino principal. El webhook —cuando esté— es el respaldo para cuando
 * alguien cierra el navegador justo después de aprobar y esta llamada nunca sale.
 * Los dos terminan en confirmarPago(), que es idempotente.
 */
export async function POST(request: Request) {
  if (!paypalConfigurado()) {
    return NextResponse.json({ error: 'paypal_sin_configurar' }, { status: 503 })
  }

  let uid = ''
  let orderID = ''
  try {
    const b = (await request.json()) as { uid?: unknown; orderID?: unknown }
    uid = String(b.uid ?? '')
    orderID = String(b.orderID ?? '')
  } catch {
    return NextResponse.json({ error: 'datos_invalidos' }, { status: 400 })
  }
  if (!uid || !orderID) {
    return NextResponse.json({ error: 'datos_invalidos' }, { status: 400 })
  }

  const reserva = await getReservaInterna(uid)
  if (!reserva) return NextResponse.json({ error: 'no_existe' }, { status: 404 })

  // Si ya está paga, no se vuelve a llamar a PayPal: capturar dos veces da error y
  // además el usuario podría estar recargando la página de éxito.
  if (reserva.status === 'paid') {
    return NextResponse.json({ ok: true, yaEstaba: true })
  }

  try {
    const captura = await capturarOrden(orderID)

    const unidad = captura.purchase_units?.[0]
    const pago = unidad?.payments?.captures?.[0]

    if (!pago || pago.status !== 'COMPLETED') {
      console.error('[paypal/capture] captura no completada', orderID, captura.status)
      return NextResponse.json({ error: 'no_completado' }, { status: 402 })
    }

    // La orden tiene que ser de esta reserva: sin este chequeo, alguien podría capturar
    // una orden de otra reserva contra este uid.
    if (unidad?.custom_id && unidad.custom_id !== uid) {
      console.error('[paypal/capture] custom_id', unidad.custom_id, '!= uid', uid)
      return NextResponse.json({ error: 'no_coincide' }, { status: 409 })
    }

    const centavos = Math.round(Number(pago.amount.value) * 100)

    const r = await confirmarPago({
      uid,
      provider: 'paypal',
      providerRef: pago.id,
      amountCentavos: centavos,
      currency: pago.amount.currency_code,
    })

    if (!r.ok) {
      return NextResponse.json({ error: r.reason }, { status: 409 })
    }

    if (!r.yaEstaba && !r.overbooked) {
      // El mail no puede hacer fallar un cobro que ya se hizo.
      await enviarConfirmacion({
        uid: reserva.uid,
        name: reserva.name,
        email: reserva.email,
        phone: reserva.phone,
        date: reserva.date,
        time: reserva.time,
        seats: reserva.seats,
        withClass: reserva.withClass,
        amount: centavos,
        currency: pago.amount.currency_code,
        locale: reserva.locale,
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, overbooked: r.overbooked ?? false })
  } catch (err) {
    console.error('[paypal/capture]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'paypal' }, { status: 502 })
  }
}

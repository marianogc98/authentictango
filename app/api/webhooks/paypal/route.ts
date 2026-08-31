import { NextResponse } from 'next/server'
import { confirmarPago } from '@/lib/booking/confirmar'
import { getReservaInterna } from '@/lib/booking/consulta'
import { enviarConfirmacion } from '@/lib/booking/emails'
import { firmaWebhookValida, verOrden, webhookConfigurado } from '@/lib/payments/paypal'

export const dynamic = 'force-dynamic'

type Evento = {
  event_type?: string
  resource?: {
    id?: string
    status?: string
    custom_id?: string
    amount?: { currency_code?: string; value?: string }
    supplementary_data?: { related_ids?: { order_id?: string } }
  }
}

/**
 * POST /api/webhooks/paypal
 *
 * Respaldo de /api/payments/paypal/capture: cubre a quien aprueba el pago y cierra la
 * pestaña antes de que la captura del navegador llegue al servidor. Los dos caminos
 * terminan en confirmarPago(), que es idempotente, así que pueden ejecutarse los dos
 * para el mismo pago sin cobrar ni mandar mails dos veces.
 *
 * Salvo por la firma inválida y la falta de configuración, siempre devuelve 200: un 500
 * hace que PayPal reintente durante días algo que no se arregla solo, y si falla
 * demasiadas veces seguidas puede llegar a desactivar el webhook.
 */
export async function POST(request: Request) {
  // Hay que leer el cuerpo crudo, no el parseado: la firma se calculó sobre estos bytes.
  const raw = await request.text()

  if (!webhookConfigurado()) {
    console.error('[paypal/webhook] sin PAYPAL_WEBHOOK_ID: no se puede verificar la firma')
    // 503 y no 200: PayPal reintenta, y así el evento no se pierde si la variable se
    // agrega en las horas siguientes.
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  if (!(await firmaWebhookValida(raw, request.headers))) {
    console.error('[paypal/webhook] firma inválida')
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  let evento: Evento = {}
  try {
    evento = JSON.parse(raw) as Evento
  } catch {
    return NextResponse.json({ ok: true, ignorado: true })
  }

  // Los demás eventos (denegado, reembolso) se registran y no tocan la reserva: un
  // reembolso lo decide una persona desde el panel, no este endpoint.
  if (evento.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
    return NextResponse.json({ ok: true, ignorado: true })
  }

  const captura = evento.resource
  if (!captura?.id || captura.status !== 'COMPLETED') {
    return NextResponse.json({ ok: true, ignorado: true })
  }

  try {
    // custom_id llega en la captura porque se puso al crear la orden. Si por algún motivo
    // no viniera, se recupera consultando la orden: es lo único que ata un cobro a su reserva.
    let uid = captura.custom_id ?? ''
    if (!uid) {
      const orderId = captura.supplementary_data?.related_ids?.order_id
      if (orderId) uid = (await verOrden(orderId)).purchase_units?.[0]?.custom_id ?? ''
    }

    if (!uid) {
      console.error('[paypal/webhook] captura', captura.id, 'sin uid de reserva')
      return NextResponse.json({ ok: true })
    }

    const reserva = await getReservaInterna(uid)
    if (!reserva) {
      console.error('[paypal/webhook] captura', captura.id, 'sin reserva para', uid)
      return NextResponse.json({ ok: true })
    }

    const moneda = captura.amount?.currency_code ?? 'USD'
    const centavos = Math.round(Number(captura.amount?.value ?? 0) * 100)

    const r = await confirmarPago({
      uid,
      provider: 'paypal',
      providerRef: captura.id,
      amountCentavos: centavos,
      currency: moneda,
    })

    if (!r.ok) {
      console.error('[paypal/webhook]', uid, 'no se confirmó:', r.reason)
      return NextResponse.json({ ok: true })
    }

    // Sólo la primera confirmación manda mails: la captura del navegador pudo haberla
    // hecho ya, y nadie quiere recibir la confirmación dos veces.
    if (!r.yaEstaba && !r.overbooked) {
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
        currency: moneda,
        locale: reserva.locale,
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[paypal/webhook]', captura.id, err instanceof Error ? err.message : err)
    // 200 a propósito: ver el comentario de arriba.
    return NextResponse.json({ ok: true })
  }
}

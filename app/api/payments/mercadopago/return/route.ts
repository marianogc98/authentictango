import { NextResponse } from 'next/server'
import { confirmarPago } from '@/lib/booking/confirmar'
import { getReservaInterna } from '@/lib/booking/consulta'
import { enviarConfirmacion } from '@/lib/booking/emails'
import { getPago, mpConfigurado } from '@/lib/payments/mercadopago'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

/** Las rutas tienen slug propio por idioma, así que se arman a mano. */
function destino(locale: string, tipo: 'gracias' | 'reserva', uid?: string): string {
  const es = locale === 'es'
  // El uid va en el querystring: la página de gracias lo usa para mostrar el detalle.
  if (tipo === 'gracias') {
    return `${SITE_URL}${es ? '/es/gracias' : '/thank-you'}${uid ? `?uid=${uid}` : ''}`
  }
  return `${SITE_URL}${es ? `/es/reservar/${uid}` : `/book/${uid}`}`
}

/**
 * GET /api/payments/mercadopago/return
 *
 * A donde vuelve el navegador después del checkout. Confirma el pago consultándolo a
 * Mercado Pago y manda al cliente a la página que corresponda.
 *
 * El querystring de MP NO se usa para decidir nada: dice `status=approved` pero viene
 * de la barra de direcciones y cualquiera puede escribirlo. La única fuente de verdad
 * es la consulta del pago contra la API.
 *
 * Esto cubre el caso normal. El webhook —cuando esté configurado— cubre a quien cierra
 * el navegador antes de volver. Los dos terminan en confirmarPago(), que es idempotente.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const uid = url.searchParams.get('uid') ?? ''
  // MP manda uno u otro según el flujo.
  const pagoId = url.searchParams.get('payment_id') ?? url.searchParams.get('collection_id')

  const reserva = await getReservaInterna(uid)
  if (!reserva) return NextResponse.redirect(`${SITE_URL}/book`)

  const volverAlPago = destino(reserva.locale, 'reserva', uid)

  // Ya confirmada por el webhook o por una vuelta anterior.
  if (reserva.status === 'paid') {
    return NextResponse.redirect(destino(reserva.locale, 'gracias', uid))
  }

  if (!mpConfigurado() || !pagoId || pagoId === 'null') {
    return NextResponse.redirect(volverAlPago)
  }

  try {
    const pago = await getPago(pagoId)

    // El pago tiene que ser de esta reserva.
    if (pago.external_reference && pago.external_reference !== uid) {
      console.error('[mp/return] external_reference', pago.external_reference, '!= uid', uid)
      return NextResponse.redirect(volverAlPago)
    }

    // Sólo 'approved' confirma. 'pending' e 'in_process' se resuelven después por webhook.
    if (pago.status !== 'approved') {
      return NextResponse.redirect(volverAlPago)
    }

    const centavos = Math.round((pago.transaction_amount ?? 0) * 100)

    const r = await confirmarPago({
      uid,
      provider: 'mercadopago',
      providerRef: String(pago.id),
      amountCentavos: centavos,
      currency: pago.currency_id ?? 'ARS',
    })

    if (!r.ok) return NextResponse.redirect(volverAlPago)

    if (!r.yaEstaba && !r.overbooked) {
      await enviarConfirmacion({
        uid: reserva.uid,
        name: reserva.name,
        email: reserva.email,
        phone: reserva.phone,
        date: reserva.date,
        time: reserva.time,
        seats: reserva.seats,
        amount: centavos,
        currency: pago.currency_id ?? 'ARS',
        locale: reserva.locale,
      }).catch(() => {})
    }

    // Si se cobró pero el lugar ya no estaba, la página de la reserva lo explica.
    return NextResponse.redirect(
      r.overbooked ? volverAlPago : destino(reserva.locale, 'gracias', uid),
    )
  } catch (err) {
    console.error('[mp/return]', err instanceof Error ? err.message : err)
    return NextResponse.redirect(volverAlPago)
  }
}

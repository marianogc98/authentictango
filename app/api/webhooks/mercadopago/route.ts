import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { confirmarPago } from '@/lib/booking/confirmar'
import { getReservaInterna } from '@/lib/booking/consulta'
import { enviarConfirmacion } from '@/lib/booking/emails'
import { getPago, mpConfigurado } from '@/lib/payments/mercadopago'

export const dynamic = 'force-dynamic'

const SECRETO = process.env.MP_WEBHOOK_SECRET?.trim() ?? ''

/**
 * Valida la firma de Mercado Pago.
 *
 * El manifiesto es `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` firmado con HMAC
 * SHA-256. Sin esto, cualquiera que conozca la URL puede mandar un POST diciendo que un
 * pago se aprobó — y como confirmarPago() consulta el pago real contra la API antes de
 * confirmar, el daño está acotado, pero igual no hay razón para aceptar basura.
 */
function firmaValida(request: Request, dataId: string): boolean {
  if (!SECRETO) return true // sin secreto configurado no se puede validar

  const cabecera = request.headers.get('x-signature') ?? ''
  const requestId = request.headers.get('x-request-id') ?? ''

  const partes = Object.fromEntries(
    cabecera.split(',').map((p) => {
      const [k, ...v] = p.split('=')
      return [k.trim(), v.join('=').trim()]
    }),
  ) as { ts?: string; v1?: string }

  if (!partes.ts || !partes.v1) return false

  const manifiesto = `id:${dataId};request-id:${requestId};ts:${partes.ts};`
  const esperado = createHmac('sha256', SECRETO).update(manifiesto).digest('hex')

  const a = Buffer.from(esperado, 'utf8')
  const b = Buffer.from(partes.v1, 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * POST /api/webhooks/mercadopago
 *
 * Respaldo del retorno del navegador: cubre a quien paga y cierra la pestaña sin volver.
 * Termina en confirmarPago(), igual que el retorno, y esa función es idempotente — así
 * que los dos caminos pueden ejecutarse para el mismo pago sin duplicar nada.
 *
 * Siempre devuelve 200, incluso ante errores nuestros: un 500 hace que Mercado Pago
 * reintente en bucle. Lo que falle queda en el log para revisarlo.
 */
export async function POST(request: Request) {
  const url = new URL(request.url)

  let cuerpo: { type?: string; action?: string; data?: { id?: string | number } } = {}
  try {
    cuerpo = await request.json()
  } catch {
    // MP a veces manda sólo querystring.
  }

  const tipo = cuerpo.type ?? url.searchParams.get('type') ?? ''
  const dataId = String(cuerpo.data?.id ?? url.searchParams.get('data.id') ?? '')

  // Sólo interesan las notificaciones de pago.
  if (tipo !== 'payment' || !dataId) {
    return NextResponse.json({ ok: true, ignorado: true })
  }

  if (!firmaValida(request, dataId)) {
    console.error('[mp/webhook] firma inválida para el pago', dataId)
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  if (!mpConfigurado()) {
    console.error('[mp/webhook] sin MP_ACCESS_TOKEN: no se puede verificar el pago', dataId)
    return NextResponse.json({ ok: true })
  }

  try {
    const pago = await getPago(dataId)

    if (pago.status !== 'approved') {
      return NextResponse.json({ ok: true, estado: pago.status })
    }

    const uid = pago.external_reference ?? ''
    const reserva = await getReservaInterna(uid)
    if (!reserva) {
      console.error('[mp/webhook] pago', dataId, 'sin reserva para', uid)
      return NextResponse.json({ ok: true })
    }

    const centavos = Math.round((pago.transaction_amount ?? 0) * 100)

    const r = await confirmarPago({
      uid,
      provider: 'mercadopago',
      providerRef: String(pago.id),
      amountCentavos: centavos,
      currency: pago.currency_id ?? 'ARS',
    })

    // Sólo la primera confirmación manda mails: el retorno del navegador pudo haberla
    // hecho ya, y nadie quiere recibir la confirmación dos veces.
    if (r.ok && !r.yaEstaba && !r.overbooked) {
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

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[mp/webhook]', dataId, err instanceof Error ? err.message : err)
    // 200 a propósito: un 500 dispara reintentos en bucle por algo que no se arregla solo.
    return NextResponse.json({ ok: true })
  }
}

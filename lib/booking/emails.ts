import { Resend } from 'resend'
import { formatearPrecio, hhmm } from './dinero'

const DIRECCION = 'Av. Corrientes 838, Ciudad Autónoma de Buenos Aires'

function escapar(texto: string): string {
  const mapa: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }
  return String(texto).replace(/[&<>"']/g, (m) => mapa[m])
}

function fechaLarga(date: string, locale: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(locale === 'es' ? 'es-AR' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

export type DatosReserva = {
  uid: string
  name: string
  email: string
  phone?: string | null
  date: string
  time: string
  seats: number
  amount: number
  currency: string
  locale: string
}

/**
 * Envía la confirmación al cliente y el aviso a la organizadora.
 *
 * Nunca lanza: un fallo de Resend no puede tirar abajo la confirmación de un pago que ya
 * se cobró. Si el mail no sale, la reserva igual queda paga y visible en el panel, que es
 * lo que importa. El error queda en el log.
 */
export async function enviarConfirmacion(r: DatosReserva): Promise<void> {
  const clave = process.env.RESEND_API_KEY?.trim()
  if (!clave) {
    console.warn('[emails] Sin RESEND_API_KEY: no se envió la confirmación de', r.uid)
    return
  }

  // Se instancia acá y no en el scope del módulo: el constructor lanza si falta la clave.
  const resend = new Resend(clave)
  const from = process.env.FROM_EMAIL
    || 'The Authentic Tango Experience <onboarding@resend.dev>'

  const es = r.locale === 'es'
  const fecha = fechaLarga(r.date, r.locale)
  const importe = formatearPrecio(r.amount, r.currency as 'USD' | 'ARS', r.locale)

  const detalle = `
    <table style="border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:4px 16px 4px 0;color:#666">${es ? 'Fecha' : 'Date'}</td>
          <td style="padding:4px 0"><strong>${escapar(fecha)}</strong></td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#666">${es ? 'Hora' : 'Time'}</td>
          <td style="padding:4px 0"><strong>${hhmm(r.time)}</strong> (Buenos Aires)</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#666">${es ? 'Personas' : 'People'}</td>
          <td style="padding:4px 0"><strong>${r.seats}</strong></td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#666">${es ? 'Total' : 'Total'}</td>
          <td style="padding:4px 0"><strong>${escapar(importe)}</strong></td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#666">${es ? 'Dónde' : 'Where'}</td>
          <td style="padding:4px 0">${DIRECCION}</td></tr>
    </table>`

  const alCliente = `
    <div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#111">
      <h2 style="margin:0 0 8px">${es ? '¡Reserva confirmada!' : 'Booking confirmed!'}</h2>
      <p>${es ? `Hola ${escapar(r.name)}, recibimos tu pago y tu lugar está reservado.`
              : `Hi ${escapar(r.name)}, we received your payment and your spot is booked.`}</p>
      ${detalle}
      <p style="color:#666;font-size:13px">
        ${es ? 'Si necesitás cambiar algo, respondé este mail.'
             : 'If you need to change anything, just reply to this email.'}
      </p>
      <p style="color:#999;font-size:12px">${es ? 'Código de reserva' : 'Booking code'}: ${r.uid}</p>
    </div>`

  const aLaOrganizadora = `
    <div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#111">
      <h2 style="margin:0 0 8px">Nueva reserva pagada</h2>
      <p><strong>${escapar(r.name)}</strong><br>
         <a href="mailto:${escapar(r.email)}">${escapar(r.email)}</a>
         ${r.phone ? `<br><a href="tel:${escapar(r.phone)}">${escapar(r.phone)}</a>` : ''}</p>
      ${detalle}
      <p style="color:#999;font-size:12px">${r.uid}</p>
    </div>`

  const aviso = process.env.CONTACT_EMAIL?.trim()

  const envios: Array<Promise<unknown>> = [
    resend.emails.send({
      from,
      to: [r.email],
      subject: es
        ? `Reserva confirmada · ${fecha}`
        : `Booking confirmed · ${fecha}`,
      html: alCliente,
      // El mail invita a responder, y la dirección del `from` no es un buzón real:
      // Resend firma en nombre del dominio, pero nadie lee reservas@. Sin este
      // replyTo, cada respuesta de un cliente se perdería.
      ...(aviso ? { replyTo: aviso } : {}),
    }),
  ]

  if (aviso) {
    envios.push(resend.emails.send({
      from,
      to: [aviso],
      subject: `Nueva reserva: ${r.name} · ${fecha} ${hhmm(r.time)}`,
      html: aLaOrganizadora,
      replyTo: r.email,
    }))
  }

  const resultados = await Promise.allSettled(envios)
  for (const res of resultados) {
    if (res.status === 'rejected') {
      console.error('[emails] fallo enviando confirmación de', r.uid, res.reason)
    }
  }
}

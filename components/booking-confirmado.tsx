'use client'

import { useEffect } from 'react'
import { trackGaEvent } from '@/lib/utils/gtag'

/**
 * Emite `booking_confirmed` cuando una reserva ya cobrada llega a la página de gracias.
 *
 * Vive acá y no en el componente de PayPal porque los dos métodos terminan en esta
 * página: PayPal la abre con un router.push después de capturar, y Mercado Pago llega
 * por el redirect del servidor. Con el evento en el botón de PayPal, toda venta en
 * pesos era invisible en GA4 — se veía el booking_started y después nada.
 *
 * El disparo se marca en localStorage contra el uid: la página de gracias se recarga,
 * se comparte y se deja abierta en una pestaña, y cada recarga volvería a contar la
 * misma venta. El acceso va en try/catch porque en modo privado tira en vez de fallar
 * en silencio, y perder la protección es mejor que romper la pantalla de gracias.
 */
export function BookingConfirmado({
  uid, value, currency, method, seats, conClase, locale,
}: {
  uid: string
  /** En unidades de la moneda, no en centavos: es lo que GA4 espera en `value`. */
  value: number | null
  currency: string | null
  method: string | null
  seats: number
  conClase: boolean
  locale: string
}) {
  useEffect(() => {
    const clave = `ga_booking_confirmed_${uid}`

    try {
      if (localStorage.getItem(clave)) return
      localStorage.setItem(clave, '1')
    } catch {
      // Sin localStorage se mide igual, asumiendo el riesgo de contar dos veces.
    }

    trackGaEvent('booking_confirmed', {
      locale,
      method,
      seats: String(seats),
      con_clase: conClase ? 'si' : 'no',
      // value y currency van juntos o no van: GA4 no reporta ingresos con uno solo.
      ...(value != null && currency ? { value, currency } : {}),
    }).catch(() => {})
  }, [uid, value, currency, method, seats, conClase, locale])

  return null
}

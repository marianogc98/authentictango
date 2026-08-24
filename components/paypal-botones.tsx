'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { trackGaEvent } from '@/lib/utils/gtag'

type Botones = {
  render: (contenedor: HTMLElement) => Promise<void>
  close?: () => void
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (opciones: Record<string, unknown>) => Botones
    }
  }
}

/**
 * Botones de PayPal sobre el SDK oficial.
 *
 * Se carga el script a mano en vez de sumar @paypal/react-paypal-js: el wrapper agrega
 * una dependencia y un provider para lo que acá son treinta líneas.
 *
 * `enable-funding=card` pide que aparezca el botón de tarjeta suelto, y en la orden se
 * manda `landing_page: BILLING`. Con cuenta argentina eso mejora la tasa de gente que ve
 * el formulario de tarjeta directo, pero PayPal decide igual según su scoring: no hay
 * forma de garantizar que no pida iniciar sesión.
 */
export function PaypalBotones({
  uid,
  clientId,
  locale,
  seats,
}: {
  uid: string
  clientId: string
  locale: string
  seats: number
}) {
  const t = useTranslations('pay')
  const router = useRouter()
  const contenedor = useRef<HTMLDivElement>(null)
  const montado = useRef(false)

  const [cargado, setCargado] = useState(false)
  const [estado, setEstado] = useState<'idle' | 'procesando' | 'error'>('idle')
  const [mensaje, setMensaje] = useState<string | null>(null)

  useEffect(() => {
    if (!cargado || !window.paypal || !contenedor.current) return
    // En React estricto el efecto corre dos veces: sin esto se renderizan dos juegos.
    if (montado.current) return
    montado.current = true

    const botones = window.paypal.Buttons({
      style: { layout: 'vertical', shape: 'rect', label: 'pay' },

      createOrder: async () => {
        const res = await fetch('/api/payments/paypal/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'create')
        return data.orderID as string
      },

      onApprove: async (data: { orderID: string }) => {
        setEstado('procesando')
        setMensaje(t('payDone'))

        const res = await fetch('/api/payments/paypal/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid, orderID: data.orderID }),
        })
        const cuerpo = await res.json()

        if (!res.ok) {
          setEstado('error')
          setMensaje(t('payError'))
          return
        }

        if (cuerpo.overbooked) {
          setEstado('error')
          setMensaje(t('overbooked'))
          return
        }

        // Éste sí es el evento clave marcado en GA4: sólo cuando el pago se acreditó.
        trackGaEvent('booking_confirmed', {
          locale,
          method: 'paypal',
          seats: String(seats),
          currency: 'USD',
        }).catch(() => {})

        router.push('/thank-you')
      },

      onCancel: () => {
        setEstado('idle')
        setMensaje(null)
      },

      onError: (err: unknown) => {
        console.error('[paypal] error del SDK:', err)
        setEstado('error')
        setMensaje(t('payError'))
      },
    })

    botones.render(contenedor.current).catch((err) => {
      console.error('[paypal] no se pudo renderizar:', err)
      setEstado('error')
      setMensaje(t('payError'))
    })
  }, [cargado, uid, locale, seats, router, t])

  const sdk =
    `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}` +
    `&currency=USD&intent=capture&enable-funding=card` +
    `&disable-funding=paylater,credit&locale=${locale === 'es' ? 'es_AR' : 'en_US'}`

  return (
    <div className="space-y-3">
      <Script src={sdk} strategy="afterInteractive" onLoad={() => setCargado(true)}
        onError={() => { setEstado('error'); setMensaje(t('payError')) }} />

      {!cargado && estado !== 'error' && (
        <p className="py-6 text-center text-sm text-muted-foreground">{t('payLoading')}</p>
      )}

      {/* Se oculta mientras procesa para que nadie apriete dos veces. */}
      <div ref={contenedor} className={estado === 'procesando' ? 'pointer-events-none opacity-40' : ''} />

      {mensaje && (
        <p
          role="status"
          className={`rounded-md border p-3 text-sm ${
            estado === 'error'
              ? 'border-destructive/40 bg-destructive/10'
              : 'border-border bg-muted'
          }`}
        >
          {mensaje}
        </p>
      )}
    </div>
  )
}

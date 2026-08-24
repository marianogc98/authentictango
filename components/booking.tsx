"use client"

import { useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Cal, { getCalApi } from '@calcom/embed-react'
import { useRouter } from '@/i18n/navigation'
import { trackGaEvent } from '@/lib/utils/gtag'

// Slug del calendario en Cal.com (antes: https://cal.com/<slug>/)
const CAL_LINK = 'maria-ines-ocampos-yhkfwt'
const CONVERSION_EVENT = 'booking_confirmed'

export function Booking() {
  const t = useTranslations('booking')
  const tMap = useTranslations('map')
  const locale = useLocale()
  const router = useRouter()

  useEffect(() => {
    let cancelado = false

    ;(async () => {
      try {
        const cal = await getCalApi()
        if (cancelado) return

        // Cal.com avisa desde el iframe cuando la reserva se confirmó.
        // Reemplaza al "Redirect on booking" del plan pago: registramos la
        // conversión y navegamos nosotros a la página de gracias.
        cal('on', {
          action: 'bookingSuccessfulV2',
          callback: (e: CustomEvent<{ data?: Record<string, unknown> }>) => {
            const d = e.detail?.data ?? {}

            // Sin nombre ni email: GA4 no admite datos personales.
            const payload = {
              locale,
              booking_uid: String(d.uid ?? ''),
              event_type_id: String(d.eventTypeId ?? ''),
              booking_status: String(d.status ?? ''),
            }

            trackGaEvent(CONVERSION_EVENT, payload).catch(() => {})

            // next-intl resuelve el slug por idioma: /thank-you o /es/gracias
            router.push('/thank-you')
          },
        })
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Cal.com] No se pudo suscribir a bookingSuccessfulV2:', err)
        }
      }
    })()

    return () => {
      cancelado = true
    }
  }, [locale, router])

  return (
    <section id="booking" className="py-16 lg:py-24 bg-secondary">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('description')}
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8 lg:items-stretch">
            {/* En móvil: booking primero (order-1), mapa después (order-2). En desktop: mapa izquierda (order-1), booking derecha (order-2). */}
            {/* Map - 25% en desktop; en móvil va segundo y 20% menos alto */}
            <div className="order-2 lg:order-1 lg:col-span-1">
              <div className="bg-card border border-border rounded-lg overflow-hidden sticky top-8 h-full flex flex-col">
                <div className="p-4 border-b border-border flex-shrink-0">
                  <h3 className="font-sans text-lg font-bold text-foreground text-center">
                    {tMap('title')}
                  </h3>
                </div>
                <div className="relative flex-1 min-h-[480px] lg:min-h-[600px]">
                  <iframe
                    src={`${tMap('location')}&t=k`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={tMap('title')}
                    className="absolute inset-0"
                  />
                </div>
              </div>
            </div>

            {/* Cal.com - 75% en desktop; en móvil va primero */}
            <div className="order-1 lg:order-2 lg:col-span-3">
              <div className="bg-card border border-border rounded-lg overflow-hidden h-full">
                <Cal
                  calLink={CAL_LINK}
                  className="w-full h-full min-h-[600px]"
                  style={{ width: '100%', height: '100%', minHeight: 600, overflow: 'auto' }}
                  config={{ layout: 'month_view' }}
                />
              </div>
            </div>
          </div>
      </div>
    </section>
  )
}

"use client"

import { useLocale, useTranslations } from 'next-intl'
import { Reserva } from '@/components/reserva'

/**
 * Sección de reservas del home.
 *
 * Antes embebía el calendario de Cal.com. Se reemplazó por el flujo propio: Cal obligaba
 * a los clientes a iniciar sesión en PayPal para pagar, y su app de pagos no permite
 * integrar Mercado Pago, que es la vía que sí acepta tarjetas sin cuenta.
 *
 * El flujo va embebido y no como link a /book para no sumar un click: el CTA del hero
 * baja hasta acá y el visitante reserva sin salir de la página. /book sigue existiendo
 * como página propia, indexable y linkeable.
 */
export function Booking() {
  const t = useTranslations('booking')
  const tMap = useTranslations('map')
  const locale = useLocale()

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

        <div className="grid lg:grid-cols-4 gap-8 lg:items-start">
          {/* En móvil: reserva primero (order-1), mapa después. En desktop: mapa a la izquierda. */}
          <div className="order-2 lg:order-1 lg:col-span-1">
            <div className="bg-card border border-border rounded-lg overflow-hidden sticky top-8 flex flex-col">
              <div className="p-4 border-b border-border flex-shrink-0">
                <h3 className="font-sans text-lg font-bold text-foreground text-center">
                  {tMap('title')}
                </h3>
              </div>
              <div className="relative min-h-[380px] lg:min-h-[480px]">
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

          <div className="order-1 lg:order-2 lg:col-span-3">
            <Reserva locale={locale} embebido />
          </div>
        </div>
      </div>
    </section>
  )
}

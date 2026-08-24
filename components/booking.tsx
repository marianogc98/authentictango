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
 * El mapa va debajo y no al costado: con el calendario y el checkout ya ocupando dos
 * columnas, ponerlo al lado dejaba tres cosas peleando por el ancho y desarmaba la
 * lectura. Abajo y ancho cumple la misma función —ubicar el lugar— sin competir.
 */
export function Booking() {
  const t = useTranslations('booking')
  const tMap = useTranslations('map')
  const locale = useLocale()

  return (
    <section id="booking" className="py-16 lg:py-24 bg-secondary">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-sans text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            {t('description')}
          </p>
        </div>

        <Reserva locale={locale} embebido />

        <div className="mt-8 w-full">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border p-3">
              <h3 className="text-center font-sans text-sm font-bold text-foreground">
                {tMap('title')}
              </h3>
            </div>
            {/* Más alto en desktop: a 1200px de ancho, 256px de alto se veía como una franja. */}
            <div className="relative h-64 lg:h-80">
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
      </div>
    </section>
  )
}

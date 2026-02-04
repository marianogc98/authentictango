"use client"

import { useTranslations } from 'next-intl'

const CAL_EMBED_URL = 'https://cal.com/maria-ines-ocampos/'

export function Booking() {
  const t = useTranslations('booking')
  const tMap = useTranslations('map')

  return (
    <section id="booking" className="py-20 lg:py-32 bg-secondary">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
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
                  <h3 className="font-serif text-lg font-bold text-foreground text-center">
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
                <div className="relative min-h-[600px] w-full h-full">
                  <iframe
                    src={CAL_EMBED_URL}
                    title={t('title')}
                    className="absolute inset-0 w-full h-full border-0"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
      </div>
    </section>
  )
}

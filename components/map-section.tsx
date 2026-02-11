"use client"

import { MapPin } from "lucide-react"
import { useTranslations } from 'next-intl'

export function MapSection() {
  const t = useTranslations('map')

  const neighborhoods = [
    t('neighborhoods.sanTelmo'),
    t('neighborhoods.laBoca'),
    t('neighborhoods.abasto'),
    t('neighborhoods.palermo'),
  ]

  return (
    <section id="map" className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('description')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            {neighborhoods.map((neighborhood, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-foreground text-lg">{neighborhood}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="relative aspect-video lg:aspect-square rounded-lg overflow-hidden bg-secondary">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d52512.34577772582!2d-58.43075254179688!3d-34.60368469999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bccacb183090e7%3A0x8d9e4d4ab3e9e8de!2sSan%20Telmo%2C%20Buenos%20Aires!5e0!3m2!1sen!2sar!4v1700000000000!5m2!1sen!2sar"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa de Buenos Aires"
              className="grayscale"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

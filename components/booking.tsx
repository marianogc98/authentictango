"use client"

import { useEffect } from "react"
import { useTranslations } from 'next-intl'
import Cal, { getCalApi } from "@calcom/embed-react"

export function Booking() {
  const t = useTranslations('booking')
  const tMap = useTranslations('map')

  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ "namespace": "tour" })
      cal("ui", { "hideEventTypeDetails": false, "layout": "month_view" })
    })()
  }, [])

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

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8 lg:items-stretch">
            {/* Map - 25% en desktop */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-lg overflow-hidden sticky top-8 h-full flex flex-col">
                <div className="p-4 border-b border-border flex-shrink-0">
                  <h3 className="font-serif text-lg font-bold text-foreground text-center">
                    {tMap('title')}
                  </h3>
                </div>
                <div className="relative flex-1 min-h-[600px]">
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

            {/* Cal.com Calendar - 75% en desktop */}
            <div className="lg:col-span-3">
              <div className="bg-card border border-border rounded-lg overflow-hidden h-full">
                <div className="relative min-h-[600px] w-full h-full">
                  <Cal
                    namespace="tour"
                    calLink="mariano-caudevila-9hqkk0/tour"
                    style={{ width: "100%", height: "100%", overflow: "scroll" }}
                    config={{ "layout": "month_view" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

"use client"

import { ArrowRight } from "lucide-react"
import { useLocale, useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import useEmblaCarousel from 'embla-carousel-react'
import { useState, useEffect, useCallback } from 'react'
import { RichText } from '@/components/rich-text'
import { Plegable } from '@/components/plegable'
import { montoSuelto } from '@/lib/booking/dinero'
import type { PrecioDesde } from '@/lib/seo/oferta'

const processDescription = (text: string): string => {
  return text.replace(/\[BOLD\](.*?)\[\/BOLD\]/g, '<strong>$1</strong>')
}

const tourKeys = ['private', 'group']

/**
 * Las dos variantes del mismo tour.
 *
 * El precio no se escribe en los mensajes: llega en `precios`, calculado sobre los horarios
 * cargados en el panel. Un "desde" escrito a mano queda viejo la primera vez que ella toca
 * un precio, y la web termina prometiendo un número que el checkout no cobra.
 *
 * Las dos tarjetas se ven igual —mismo alto, mismo borde, mismo botón— y sólo las separa la
 * chapita de "Popular": con la segunda en un tono más suave parecía deshabilitada, cuando en
 * realidad se reserva por el mismo formulario que la primera.
 */
export function Services({ precios }: { precios?: PrecioDesde | null }) {
  const t = useTranslations('services')
  const locale = useLocale()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { active: false }
    }
  })

  const onSelect = useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on('reInit', onSelect)
    emblaApi.on('select', onSelect)
  }, [emblaApi, onSelect])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const renderTourCard = (key: string, index: number, isMobile: boolean = false) => {
    const isPopular = key === 'private'
    // Sin base no hay precio que mostrar. Antes que arriesgar un número inventado, la
    // tarjeta se muestra sin la línea de precio: el checkout sigue diciendo cuánto sale.
    const centavos = key === 'group' ? precios?.conClase ?? null : precios?.tour ?? null
    const itinerario = t.raw(`${key}.itinerary`) as string[]
    const cardContent = (
      <Card className="bg-card border-border transition-all duration-300 relative h-full ring-2 ring-primary pt-6">
        {isPopular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
              Popular
            </span>
          </div>
        )}
        <CardHeader className="pt-2">
          {/* La duración va en el título, sin negrita: así no hace falta repetirla abajo. */}
          <CardTitle className="font-sans text-xl text-foreground text-balance">
            {t(`${key}.title`)}{' '}
            <span className="font-normal text-muted-foreground whitespace-nowrap">
              ({t(`${key}.duration`)})
            </span>
          </CardTitle>
        </CardHeader>
        {/* El bloque de precio y botón se empuja al pie para que las dos tarjetas lo tengan
            a la misma altura aunque las descripciones midan distinto. */}
        <CardContent className="flex flex-1 flex-col space-y-4">
          {/* Cortada a pocas líneas: con el texto entero las tarjetas eran una pared y
              medían distinto. Lo que se corta queda a un "Leer más" de distancia. */}
          <Plegable lineas={5} className="text-sm text-muted-foreground text-justify hyphens-auto">
            <RichText
              content={processDescription(t(`${key}.description`))}
              className="[&_strong]:font-bold"
            />
            <p className="mt-3 font-semibold text-foreground">{t('itineraryTitle')}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {itinerario.map((paso) => <li key={paso}>{paso}</li>)}
            </ul>
          </Plegable>
          <div className="text-sm text-muted-foreground whitespace-pre-line">
            {t(`${key}.includes`)}
          </div>
          <div className="mt-auto pt-4 border-t border-border">
            {centavos !== null && (
              <p className="text-lg font-sans font-bold text-primary mb-4">
                {t(`${key}.price`, { price: montoSuelto(centavos, locale) })}
              </p>
            )}
            <Button onClick={() => scrollToSection('booking')} className="w-full">
              {t(`${key}.book`)}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )

    if (isMobile) {
      return (
        <div key={key} className="flex-[0_0_calc(100%-0.5rem)] min-w-0 shrink-0">
          {cardContent}
        </div>
      )
    }
    return <div key={key}>{cardContent}</div>
  }

  return (
    <section id="tours" className="py-12 lg:py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-6 lg:mb-8">
            <h2 className="font-sans text-2xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance">
              {t('title')}
            </h2>
          </div>

          {/* Mobile Slider */}
          <div className="md:hidden pb-4">
            <div className="px-2">
              <div className="overflow-hidden pt-8 px-2" ref={emblaRef}>
                <div className="flex items-stretch gap-2">
                  {tourKeys.map((key, index) => renderTourCard(key, index, true))}
                </div>
              </div>
            </div>
            {/* Bullets */}
            <div className="flex justify-center gap-2 mt-6">
              {tourKeys.map((_, index) => (
                <button
                  key={index}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === selectedIndex 
                      ? 'bg-primary w-6' 
                      : 'bg-muted-foreground/30'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 gap-6">
            {tourKeys.map((key, index) => renderTourCard(key, index))}
          </div>
        </div>
    </section>
  )
}

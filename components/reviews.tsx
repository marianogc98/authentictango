"use client"

import { useTranslations } from 'next-intl'
import { Star } from 'lucide-react'
import { FaAirbnb } from 'react-icons/fa'
import { SiGoogle } from 'react-icons/si'
import { Card, CardContent } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Plegable } from '@/components/plegable'
import type { ResenaPublica } from '@/lib/resenas'

function Estrellas({ cantidad }: { cantidad: number }) {
  return (
    <div className="flex shrink-0 gap-0.5" aria-label={`${cantidad}/5`}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < cantidad ? 'fill-primary text-primary' : 'fill-transparent text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  )
}

/**
 * Las reseñas salen de la base, cargadas desde el panel; los puntajes de cada plataforma
 * siguen en los textos porque son un número que ella copia de Airbnb y de Google.
 *
 * Todas van juntas y sin decir de qué plataforma es cada una: lo que importa es lo que
 * dicen. Por eso los recuadros de puntaje tampoco llevan a ningún lado.
 */
export function Reviews({ resenas }: { resenas: ResenaPublica[] }) {
  const t = useTranslations('reviews')

  const puntajes = [
    { id: 'airbnb', Icono: FaAirbnb, color: 'text-[#FF5A5F]' },
    { id: 'google', Icono: SiGoogle, color: 'text-[#4285F4]' },
  ] as const

  return (
    <section id="reviews" className="py-12 lg:py-16 bg-secondary">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-6 lg:mb-8">
          <h2 className="font-sans text-2xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance">
            {t('title')}
          </h2>
        </div>

        <div className="flex flex-row items-center justify-center gap-4 md:gap-6 mb-8 lg:mb-10">
          {puntajes.map(({ id, Icono, color }) => (
            <div
              key={id}
              className="bg-card border border-border rounded-xl p-5 md:p-6 flex-1 md:flex-none md:min-w-[220px] shadow-sm"
            >
              <div className="flex items-center gap-4">
                <Icono className={`h-10 w-10 md:h-12 md:w-12 ${color} flex-shrink-0`} />
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 md:h-6 md:w-6 fill-primary text-primary" />
                    <span className="font-sans text-2xl md:text-3xl font-bold text-foreground leading-none">
                      {t(`${id}.score`)}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    {t('count', { total: t(`${id}.total`) })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {resenas.length > 0 && (
          <div className="relative">
            <Carousel opts={{ align: 'start', loop: true }} className="w-full">
              <CarouselContent className="-ml-2 md:-ml-4">
                {resenas.map((resena) => (
                  <CarouselItem key={resena.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full gap-0 py-0 border-border shadow-sm">
                      <CardContent className="p-5 h-full flex flex-col">
                        {/* El nombre al lado de las estrellas: abajo, solo, ocupaba un renglón entero.
                            Si con el país no entra, baja de renglón en vez de cortarse. */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                            <Estrellas cantidad={resena.estrellas} />
                            <h3 className="min-w-0 font-semibold text-foreground">
                              {resena.nombre}
                              {resena.pais && <span className="font-normal text-muted-foreground">, {resena.pais}</span>}
                            </h3>
                          </div>
                          <p className="shrink-0 pt-0.5 text-xs text-muted-foreground">{resena.mes}</p>
                        </div>

                        <Plegable
                          lineas={5}
                          className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line text-justify hyphens-auto"
                        >
                          {resena.texto}
                        </Plegable>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-12" />
              <CarouselNext className="hidden md:flex -right-12" />
            </Carousel>
          </div>
        )}
      </div>
    </section>
  )
}

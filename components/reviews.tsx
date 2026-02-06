"use client"

import { useTranslations } from 'next-intl'
import { Star, Quote } from 'lucide-react'
import { FaAirbnb } from 'react-icons/fa'
import { SiGoogle } from 'react-icons/si'
import { Card, CardContent } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

export function Reviews() {
  const t = useTranslations('reviews')
  const airbnbData = t.raw('airbnb') as any
  const googleData = t.raw('google') as any

  // Función para parsear fecha "Month YYYY" a Date (soporta inglés y español)
  const parseDate = (dateString: string): Date => {
    const months: { [key: string]: number } = {
      // Inglés
      'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
      'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11,
      // Español
      'Enero': 0, 'Febrero': 1, 'Marzo': 2, 'Abril': 3, 'Mayo': 4, 'Junio': 5,
      'Julio': 6, 'Agosto': 7, 'Septiembre': 8, 'Octubre': 9, 'Noviembre': 10, 'Diciembre': 11
    }
    const [month, year] = dateString.split(' ')
    return new Date(parseInt(year), months[month] || 0, 1)
  }

  // Combinar y ordenar las reseñas por fecha (más nueva primero)
  const allReviews = [
    ...airbnbData.reviews.map((review: any) => ({ ...review, platform: 'airbnb' })),
    ...googleData.reviews.map((review: any) => ({ ...review, platform: 'google' }))
  ].sort((a, b) => {
    const dateA = parseDate(a.date)
    const dateB = parseDate(b.date)
    return dateB.getTime() - dateA.getTime() // Orden descendente (más nueva primero)
  })

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? 'fill-primary text-primary' : 'fill-transparent text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    )
  }

  const getPlatformIcon = (platform: string) => {
    if (platform === 'airbnb') {
      return <FaAirbnb className="h-5 w-5 text-[#FF5A5F]" />
    }
    return <SiGoogle className="h-5 w-5 text-[#4285F4]" />
  }

  const getPlatformColor = (platform: string) => {
    if (platform === 'airbnb') {
      return 'bg-[#FF5A5F]/10 border-[#FF5A5F]/20'
    }
    return 'bg-[#4285F4]/10 border-[#4285F4]/20'
  }

  return (
    <section id="reviews" className="py-20 lg:py-32">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
            {t('title')}
          </h2>
        </div>

        {/* Scores destacados */}
        <div className="flex flex-row items-center justify-center gap-4 md:gap-6 mb-16">
          <a
            href="https://www.airbnb.com.ar/experiences/35569"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card border border-border rounded-xl p-6 md:p-8 flex-1 md:flex-none md:min-w-[220px] hover:border-primary/50 transition-all duration-300 shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-3">
              <FaAirbnb className="h-10 w-10 md:h-12 md:w-12 text-[#FF5A5F] flex-shrink-0" />
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 md:h-6 md:w-6 fill-primary text-primary" />
                  <span className="font-sans text-2xl md:text-3xl font-bold text-foreground leading-none">
                    {airbnbData.score}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">{airbnbData.total} reseñas</p>
              </div>
            </div>
          </a>

          <div className="bg-card border border-border rounded-xl p-6 md:p-8 flex-1 md:flex-none md:min-w-[220px] hover:border-primary/50 transition-all duration-300 shadow-sm">
            <div className="flex items-center gap-4 mb-3">
              <SiGoogle className="h-10 w-10 md:h-12 md:w-12 text-[#4285F4] flex-shrink-0" />
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 md:h-6 md:w-6 fill-primary text-primary" />
                  <span className="font-sans text-2xl md:text-3xl font-bold text-foreground leading-none">
                    {googleData.score}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">{googleData.total} reseñas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel de reseñas */}
        <div className="relative">
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {allReviews.map((review: any, index: number) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2">
                  <Card className="h-full border-border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
                    <CardContent className="p-6 h-full flex flex-col">
                      {/* Icono de quote y plataforma */}
                      <div className="flex items-start justify-between mb-4">
                        <Quote className="h-8 w-8 text-primary/20" />
                        <div className={`p-2 rounded-lg border ${getPlatformColor(review.platform)}`}>
                          {getPlatformIcon(review.platform)}
                        </div>
                      </div>

                      {/* Estrellas y fecha */}
                      <div className="flex items-center justify-between mb-4">
                        {renderStars(review.rating)}
                        <p className="text-xs text-muted-foreground">
                          {review.date}
                        </p>
                      </div>

                      {/* Mensaje */}
                      <p className="text-sm text-muted-foreground flex-1 mb-4 leading-relaxed">
                        {review.message}
                      </p>

                      {/* Nombre */}
                      <div className="pt-4 border-t border-border">
                        <h4 className="font-semibold text-foreground">
                          {review.name}
                        </h4>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12" />
            <CarouselNext className="hidden md:flex -right-12" />
          </Carousel>
        </div>
      </div>
    </section>
  )
}

"use client"

import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Play, ArrowRight } from "lucide-react"

export function Hero() {
  const t = useTranslations('hero')

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Video como fondo completo - solo en móvil */}
      <div className="absolute inset-0 z-0 lg:hidden">
        <div className="absolute inset-0 w-full h-full">
          <iframe
            src="https://www.youtube.com/embed/yNpuM482hfo?autoplay=1&mute=1&loop=1&controls=0&playsinline=1&rel=0&modestbranding=1&playlist=yNpuM482hfo"
            title="Tango en Buenos Aires"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            style={{ 
              border: 'none',
              objectFit: 'cover',
              transform: 'scale(1.1)',
              minWidth: '100%',
              minHeight: '100%'
            }}
          />
        </div>
        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
      </div>

      {/* Layout para desktop: grid de 2 columnas */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8 py-20 lg:py-0 w-full">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center lg:min-h-screen">
          {/* Contenido - izquierda en desktop, centrado en móvil */}
          <div className="max-w-4xl mx-auto lg:max-w-none lg:mx-0 text-center lg:text-left">
            <h1 className="font-sans text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 text-balance">
              {t('title')}
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto lg:mx-0 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 text-pretty">
              {t('subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
              <Button size="lg" onClick={() => scrollToSection('booking')} className="text-base px-8">
                {t('bookNow')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollToSection('tours')}
                className="text-base px-8 border-white/30 hover:bg-white/10 bg-transparent text-white"
              >
                <Play className="mr-2 h-5 w-5" />
                {t('viewTours')}
              </Button>
            </div>
          </div>

          {/* Video a la derecha - solo en desktop */}
          <div className="hidden lg:block relative w-full h-full min-h-[600px] rounded-lg overflow-hidden">
            <div className="absolute inset-0">
              <iframe
                src="https://www.youtube.com/embed/yNpuM482hfo?autoplay=1&mute=1&loop=1&controls=0&playsinline=1&rel=0&modestbranding=1&playlist=yNpuM482hfo"
                title="Tango en Buenos Aires"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                style={{ border: 'none' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de scroll */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-20">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  )
}

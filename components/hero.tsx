"use client"

import Image from "next/image"
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
      {/* Foto de fondo: es lo primero que se ve, así que se carga con prioridad
          y sin lazy para no penalizar el LCP. */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-tango.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Overlay oscuro para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
      </div>

      <div className="relative z-10 container mx-auto px-4 lg:px-8 py-20 w-full">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-sans text-3xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 text-balance">
            {t('title')}
          </h1>

          <p className="text-base md:text-xl text-white/90 max-w-2xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 text-pretty">
            {t('subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
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

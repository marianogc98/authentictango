"use client"

import { Play } from "lucide-react"
import { useTranslations } from 'next-intl'
import { RichText } from '@/components/rich-text'
import { useEffect, useState, useRef } from 'react'

const processDescription = (text: string): string => {
  return text
    .replace(/\[BOLD\](.*?)\[\/BOLD\]/g, '<strong>$1</strong>')
    .replace(/\[BOOK_LINK\](.*?)\[\/BOOK_LINK\]/g, '<a href="#ebook" class="text-primary hover:opacity-80 transition-opacity underline">$1</a>')
}

const VIDEO_ID = 'yNpuM482hfo'

/**
 * Quién guía la experiencia. No es una sección propia: va arriba del contacto, en la
 * misma sección, porque se leen juntos —quién soy, y cómo escribirme— y separados
 * sumaban otro título y otro bloque de aire a una home que ya es larga.
 */
export function About() {
  const t = useTranslations('about')
  const [videoActivo, setVideoActivo] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // El link al libro es HTML del texto, no un componente: se intercepta acá para que
    // haga scroll suave en vez de saltar.
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const href = target.tagName === 'A' ? target.getAttribute('href') : null
      if (href?.startsWith('#')) {
        e.preventDefault()
        document.getElementById(href.substring(1))?.scrollIntoView({ behavior: 'smooth' })
      }
    }

    const el = ref.current
    el?.addEventListener('click', handleClick)
    return () => el?.removeEventListener('click', handleClick)
  }, [])

  return (
    <div id="about" ref={ref} className="scroll-mt-20 grid lg:grid-cols-[220px_minmax(0,1fr)] gap-8 lg:gap-12 items-center">
      {/* Es un Short: va en vertical (9:16) y con la miniatura `oardefault`, que es
          el cuadro original; `maxresdefault` es el recorte 16:9 y sale cortado.
          No se autorreproduce: hasta que no lo piden solo se ve la miniatura,
          así el reproductor de YouTube tampoco se descarga de entrada. */}
      <div className="order-2 lg:order-1 relative mx-auto w-full max-w-[240px] lg:max-w-[220px] aspect-[9/16] rounded-lg overflow-hidden bg-black">
        {videoActivo ? (
          <iframe
            src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={t('videoTitle')}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setVideoActivo(true)}
            aria-label={t('playVideo')}
            className="group absolute inset-0 w-full h-full"
          >
            <img
              src={`https://i.ytimg.com/vi/${VIDEO_ID}/oardefault.jpg`}
              alt={t('videoTitle')}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
                <Play className="h-7 w-7 translate-x-0.5" fill="currentColor" />
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="order-1 lg:order-2">
        <h2 className="font-sans text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
          {t('title')}
        </h2>
        <div className="text-muted-foreground">
          <RichText
            content={processDescription(t('description'))}
            className="whitespace-pre-line text-justify hyphens-auto [&_a]:text-primary [&_a]:hover:opacity-80 [&_a]:transition-opacity [&_a]:underline [&_strong]:font-bold"
          />
        </div>
      </div>
    </div>
  )
}

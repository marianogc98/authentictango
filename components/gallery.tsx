"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react"
import { useTranslations } from 'next-intl'
import type { ImagenGaleria } from '@/lib/galeria'

/**
 * Las fotos salen de la base y se ordenan desde el panel. Sin fotos, no hay sección.
 * Entre ellas puede haber videos de YouTube: en la grilla se ve su miniatura, y el
 * reproductor sólo se carga al abrirlo.
 */
export function Gallery({ images }: { images: ImagenGaleria[] }) {
  const t = useTranslations('gallery')
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  const openLightbox = (index: number) => setSelectedImage(index)
  const closeLightbox = () => setSelectedImage(null)
  
  const goToPrevious = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1)
    }
  }
  
  const goToNext = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === images.length - 1 ? 0 : selectedImage + 1)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage === null) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') goToNext()
      if (e.key === 'ArrowLeft') goToPrevious()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImage])

  if (images.length === 0) return null

  return (
    <section id="gallery" className="py-12 lg:py-16 bg-secondary">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-6 lg:mb-8">
          <h2 className="font-sans text-2xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance">
            {t('title')}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => {
            const isFirst = index === 0
            // En el celular van de a dos debajo de la grande: si la última queda sola,
            // ocupa el ancho entero en vez de dejar un hueco al lado.
            const isLoneLast = index > 0 && index === images.length - 1 && (images.length - 1) % 2 === 1
            return (
            <button
              key={image.id}
              onClick={() => openLightbox(index)}
              className={`relative overflow-hidden rounded-lg group cursor-pointer ${
                isFirst
                  // En desktop la grande toma el alto de las dos de al lado; con menos de
                  // tres fotos no hay al lado, y se queda cuadrada.
                  ? `col-span-2 row-span-2 aspect-square ${images.length >= 3 ? 'md:aspect-auto' : ''}`
                  : isLoneLast
                    ? "col-span-2 md:col-span-1 aspect-[2/1] md:aspect-square"
                    : "aspect-square"
              }`}
            >
              {image.youtubeId ? (
                // La miniatura viene de YouTube: next/image no la optimiza sin sumar el dominio.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes={isFirst ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 33vw, 50vw'}
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/30 transition-colors duration-300" />
              {image.youtubeId && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
                    <Play className="h-6 w-6 translate-x-0.5" fill="currentColor" />
                  </span>
                </span>
              )}
            </button>
            )
          })}
        </div>
      </div>

      {selectedImage !== null && (
        <div 
          className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-foreground hover:text-primary transition-colors"
            aria-label="Cerrar"
          >
            <X size={32} />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); goToPrevious() }}
            className="absolute left-4 text-foreground hover:text-primary transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft size={48} />
          </button>
          
          <div 
            className="relative w-full max-w-5xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            {images[selectedImage].youtubeId ? (
              <iframe
                key={images[selectedImage].id}
                src={`https://www.youtube.com/embed/${images[selectedImage].youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title={images[selectedImage].alt || t('title')}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full rounded-lg border-0"
              />
            ) : (
              <Image
                src={images[selectedImage].src}
                alt={images[selectedImage].alt}
                sizes="100vw"
                fill
                className="object-contain"
              />
            )}
          </div>
          
          <button
            onClick={(e) => { e.stopPropagation(); goToNext() }}
            className="absolute right-4 text-foreground hover:text-primary transition-colors"
            aria-label="Siguiente"
          >
            <ChevronRight size={48} />
          </button>
        </div>
      )}
    </section>
  )
}

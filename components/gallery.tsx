"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslations } from 'next-intl'

const images = [
  { src: "/images/hero-tango.webp", alt: "Pareja bailando tango" },
  { src: "/images/gallery-1.jpg", alt: "Pies de bailarines de tango" },
  { src: "/images/gallery-2.webp", alt: "Barrio San Telmo" },
  { src: "/images/gallery-3.webp", alt: "Interior de milonga tradicional" },
  { src: "/images/gallery-4.webp", alt: "Orquesta de tango en vivo" },
  { src: "/images/gallery-5.webp", alt: "Barrio La Boca" },
]

export function Gallery() {
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

  return (
    <section id="gallery" className="py-20 lg:py-32 bg-secondary">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
            {t('title')}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => {
            const isFirst = index === 0
            const isLast = index === images.length - 1
            return (
            <button
              key={index}
              onClick={() => openLightbox(index)}
              className={`relative overflow-hidden rounded-lg group cursor-pointer ${
                isFirst 
                  ? "col-span-2 row-span-2 aspect-square md:aspect-auto" 
                  : isLast 
                    ? "col-span-2 md:col-span-1 aspect-square"
                    : "aspect-square"
              }`}
            >
              <Image
                src={image.src || "/placeholder.svg"}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/30 transition-colors duration-300" />
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
            <Image
              src={images[selectedImage].src || "/placeholder.svg"}
              alt={images[selectedImage].alt}
              fill
              className="object-contain"
            />
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

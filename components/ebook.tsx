"use client"

import Image from "next/image"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { ShoppingBag, Play, BookOpen, Pencil } from "lucide-react"

export function Ebook() {
  const t = useTranslations('ebook')
  const available = t.raw('available') as Record<string, string>

  return (
    <section id="ebook" className="py-20 lg:py-32">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
              {t('title')}
            </h2>
            
            <p className="text-muted-foreground text-lg mb-8 whitespace-pre-line">
              {t('description')}
            </p>

            <div className="space-y-4">
              <h3 className="font-serif text-xl font-bold text-foreground mb-4">Available on:</h3>
              <div className="flex flex-wrap gap-4">
                {available.amazon && (
                  <a
                    href={available.amazon}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-4 border border-border rounded-lg hover:border-primary transition-colors hover:bg-card"
                    aria-label="Amazon"
                  >
                    <ShoppingBag className="h-6 w-6 text-foreground" />
                  </a>
                )}
                {available.google && (
                  <a
                    href={available.google}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-4 border border-border rounded-lg hover:border-primary transition-colors hover:bg-card"
                    aria-label="Google Play Books"
                  >
                    <Play className="h-6 w-6 text-foreground" />
                  </a>
                )}
                {available.apple && (
                  <a
                    href={available.apple}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-4 border border-border rounded-lg hover:border-primary transition-colors hover:bg-card"
                    aria-label="Apple Books"
                  >
                    <BookOpen className="h-6 w-6 text-foreground" />
                  </a>
                )}
                {available.editorialAutoresDeArgentina && (
                  <a
                    href={available.editorialAutoresDeArgentina}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-4 border border-border rounded-lg hover:border-primary transition-colors hover:bg-card"
                    aria-label="Editorial Autores de Argentina"
                  >
                    <Pencil className="h-6 w-6 text-foreground" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="relative aspect-[3/4] max-w-md mx-auto">
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src="/images/ebook-cover.png"
                  alt="Portada del ebook Entre La Patagonia y el Tango"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

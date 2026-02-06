"use client"

import Image from "next/image"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { FaAmazon } from "react-icons/fa"
import { SiGoogleplay, SiAppstore } from "react-icons/si"
import { Pencil } from "lucide-react"
import { RichText } from '@/components/rich-text'

const processDescription = (text: string): string => {
  return text.replace(/\[BOLD\](.*?)\[\/BOLD\]/g, '<strong>$1</strong>')
}

export function Ebook() {
  const t = useTranslations('ebook')
  const available = t.raw('available') as Record<string, string>

  return (
    <section id="ebook" className="py-20 lg:py-32">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1 lg:col-span-2">
            <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
              {t('title')}
            </h2>
            
            <div className="text-muted-foreground text-lg mb-8 whitespace-pre-line">
              <RichText
                content={processDescription(t('description'))}
                className="[&_strong]:font-bold"
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-sans text-xl font-bold text-foreground mb-4">{t('availableOn')}</h3>
              <div className="flex flex-wrap gap-4">
                {available.amazon && (
                  <a
                    href={available.amazon}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-2 border border-border rounded-lg hover:border-primary transition-colors hover:bg-card"
                    aria-label="Amazon"
                  >
                    <FaAmazon className="h-5 w-5 text-foreground" />
                  </a>
                )}
                {available.google && (
                  <a
                    href={available.google}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-2 border border-border rounded-lg hover:border-primary transition-colors hover:bg-card"
                    aria-label="Google Play Books"
                  >
                    <SiGoogleplay className="h-5 w-5 text-foreground" />
                  </a>
                )}
                {available.apple && (
                  <a
                    href={available.apple}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-2 border border-border rounded-lg hover:border-primary transition-colors hover:bg-card"
                    aria-label="Apple Books"
                  >
                    <SiAppstore className="h-5 w-5 text-foreground" />
                  </a>
                )}
                {available.editorialAutoresDeArgentina && (
                  <a
                    href={available.editorialAutoresDeArgentina}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-2 border border-border rounded-lg hover:border-primary transition-colors hover:bg-card"
                    aria-label="Editorial Autores de Argentina"
                  >
                    <Pencil className="h-5 w-5 text-foreground" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 relative flex items-center justify-center lg:col-span-1">
            <div className="relative aspect-[3/4] w-full max-w-[331px] mx-auto">
              <div className="relative aspect-[3/4] overflow-hidden">
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

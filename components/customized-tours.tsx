"use client"

import { ArrowRight } from "lucide-react"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { RichText } from '@/components/rich-text'

const processDescription = (text: string): string => {
  return text.replace(/\[BOLD\](.*?)\[\/BOLD\]/g, '<strong>$1</strong>')
}

export function CustomizedTours() {
  const t = useTranslations('customizedTours')

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="customized-tours" className="py-16 lg:py-24 bg-secondary">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
            {t('title')}
          </h2>
        </div>
        <div className="mb-16 text-muted-foreground text-lg whitespace-pre-line leading-relaxed">
          <RichText
            content={processDescription(t('description'))}
            className="[&_strong]:font-bold"
          />
        </div>

        <div className="flex justify-center">
          <Button
            onClick={() => scrollToSection('contact')}
            size="lg"
            className="gap-2"
          >
            {t('contactButton')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}

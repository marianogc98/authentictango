"use client"

import { GraduationCap, Building2, School, ArrowRight } from "lucide-react"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { RichText } from '@/components/rich-text'

const processDescription = (text: string): string => {
  return text.replace(/\[BOLD\](.*?)\[\/BOLD\]/g, '<strong>$1</strong>')
}

const customizedIcons = [GraduationCap, Building2, School]
const customizedKeys = ['educational', 'corporate', 'university'] as const

export function CustomizedTours() {
  const t = useTranslations('customizedTours')

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="customized-tours" className="py-20 lg:py-32 bg-secondary">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
            {t('title')}
          </h2>
        </div>
        <div className="mb-16 text-muted-foreground text-lg whitespace-pre-line leading-relaxed">
          <RichText
            content={processDescription(t('description'))}
            className="[&_strong]:font-bold"
          />
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-6">
          <div className="flex flex-wrap gap-4 sm:gap-6">
            {customizedKeys.map((key, index) => {
              const Icon = customizedIcons[index]
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 px-5 py-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-serif text-lg font-semibold text-foreground">
                    {t(`${key}.title`)}
                  </span>
                </div>
              )
            })}
          </div>
          <Button
            onClick={() => scrollToSection('contact')}
            size="lg"
            className="gap-2 shrink-0"
          >
            {t('contactButton')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}

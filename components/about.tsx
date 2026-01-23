"use client"

import Image from "next/image"
import { CheckCircle } from "lucide-react"
import { useTranslations } from 'next-intl'
import { RichText } from '@/components/rich-text'

export function About() {
  const t = useTranslations('about')

  const stats = [
    { value: '15+', label: t('years') },
    { value: '500+', label: t('tours') },
    { value: '4.9', label: t('reviews') },
  ]

  return (
    <section id="about" className="py-20 lg:py-32 bg-secondary">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="relative">
            <div className="aspect-[4/5] relative rounded-lg overflow-hidden">
              <Image
                src="/images/guide-portrait.webp"
                alt="Tu guía de tango en Buenos Aires"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground p-6 rounded-lg hidden lg:block">
              <p className="font-serif text-4xl font-bold">15+</p>
              <p className="text-sm opacity-90">{t('years')}</p>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
              {t('title')}
            </h2>
            <div className="space-y-4 text-muted-foreground mb-8">
              <RichText 
                content={t('description')}
                className="whitespace-pre-line"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-card p-4 rounded-lg border border-border text-center"
                >
                  <div className="text-2xl md:text-3xl font-bold mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

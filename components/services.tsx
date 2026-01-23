"use client"

import { User, Users, GraduationCap, Building2, School, ArrowRight } from "lucide-react"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import useEmblaCarousel from 'embla-carousel-react'
import { useState, useEffect, useCallback } from 'react'

const tourIcons = [User, Users]
const tourKeys = ['private', 'group']

const customizedIcons = [GraduationCap, Building2, School]
const customizedKeys = ['educational', 'corporate', 'university']

export function Services() {
  const t = useTranslations('services')
  const tCustomized = useTranslations('customizedTours')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedIndexCustomized, setSelectedIndexCustomized] = useState(0)
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'center',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { active: false }
    }
  })
  const [emblaRefCustomized, emblaApiCustomized] = useEmblaCarousel({ 
    align: 'center',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { active: false }
    }
  })

  const onSelect = useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [])

  const onSelectCustomized = useCallback((emblaApi: any) => {
    setSelectedIndexCustomized(emblaApi.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on('reInit', onSelect)
    emblaApi.on('select', onSelect)
  }, [emblaApi, onSelect])

  useEffect(() => {
    if (!emblaApiCustomized) return
    onSelectCustomized(emblaApiCustomized)
    emblaApiCustomized.on('reInit', onSelectCustomized)
    emblaApiCustomized.on('select', onSelectCustomized)
  }, [emblaApiCustomized, onSelectCustomized])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const renderTourCard = (key: string, index: number, isMobile: boolean = false) => {
    const Icon = tourIcons[index]
    const isPopular = key === 'private'
    const cardContent = (
      <Card 
        className={`bg-card border-border hover:border-primary/50 transition-all duration-300 relative ${
          isPopular ? "ring-2 ring-primary pt-6" : ""
        }`}
      >
        {isPopular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
              Popular
            </span>
          </div>
        )}
        <CardHeader className={isPopular ? "pt-2" : ""}>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-serif text-xl text-foreground">
            {t(`${key}.title`)}
          </CardTitle>
          <CardDescription className="text-muted-foreground whitespace-pre-line">
            {t(`${key}.description`)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t(`${key}.duration`)}</span>
          </div>
          <div className="text-sm text-muted-foreground whitespace-pre-line">
            {t(`${key}.includes`)}
          </div>
          <div className="pt-4 border-t border-border">
            <p className="text-lg font-serif font-bold text-primary mb-4">
              {t(`${key}.price`)}
            </p>
            <Button 
              onClick={() => scrollToSection('booking')} 
              className="w-full" 
              variant={isPopular ? "default" : "outline"}
            >
              {t('book')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )

    if (isMobile) {
      return (
        <div key={key} className="flex-[0_0_calc(100%-0.25rem)] min-w-0 shrink-0">
          {cardContent}
        </div>
      )
    }
    return <div key={key}>{cardContent}</div>
  }

  const renderCustomizedCard = (key: string, index: number, isMobile: boolean = false) => {
    const Icon = customizedIcons[index]
    const cardContent = (
      <Card 
        className="bg-card border-border hover:border-primary/50 transition-all duration-300"
      >
        <CardHeader>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-serif text-xl text-foreground">
            {tCustomized(`${key}.title`)}
          </CardTitle>
          <CardDescription className="text-muted-foreground whitespace-pre-line">
            {tCustomized(`${key}.description`)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => scrollToSection('contact')} 
            className="w-full" 
            variant="outline"
          >
            Contact Us
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    )

    if (isMobile) {
      return (
        <div key={key} className="flex-[0_0_calc(100%-0.25rem)] min-w-0 shrink-0">
          {cardContent}
        </div>
      )
    }
    return <div key={key}>{cardContent}</div>
  }

  return (
    <>
      {/* The Tour Section */}
      <section id="tours" className="py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
              {t('title')}
            </h2>
          </div>

          {/* Mobile Slider */}
          <div className="md:hidden pb-4">
            <div className="px-1">
              <div className="overflow-hidden pt-8 px-1" ref={emblaRef}>
                <div className="flex gap-1">
                  {tourKeys.map((key, index) => renderTourCard(key, index, true))}
                </div>
              </div>
            </div>
            {/* Bullets */}
            <div className="flex justify-center gap-2 mt-6">
              {tourKeys.map((_, index) => (
                <button
                  key={index}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === selectedIndex 
                      ? 'bg-primary w-6' 
                      : 'bg-muted-foreground/30'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 gap-6">
            {tourKeys.map((key, index) => renderTourCard(key, index))}
          </div>
        </div>
      </section>

      {/* Customized Tours Section */}
      <section id="customized-tours" className="py-20 lg:py-32 bg-secondary">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
              {tCustomized('title')}
            </h2>
          </div>

          {/* Mobile Slider */}
          <div className="md:hidden pb-4">
            <div className="px-1">
              <div className="overflow-hidden px-1" ref={emblaRefCustomized}>
                <div className="flex gap-1">
                  {customizedKeys.map((key, index) => renderCustomizedCard(key, index, true))}
                </div>
              </div>
            </div>
            {/* Bullets */}
            <div className="flex justify-center gap-2 mt-6">
              {customizedKeys.map((_, index) => (
                <button
                  key={index}
                  onClick={() => emblaApiCustomized?.scrollTo(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === selectedIndexCustomized 
                      ? 'bg-primary w-6' 
                      : 'bg-muted-foreground/30'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customizedKeys.map((key, index) => renderCustomizedCard(key, index))}
          </div>
        </div>
      </section>
    </>
  )
}

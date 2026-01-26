"use client"

import Image from "next/image"
import { CheckCircle } from "lucide-react"
import { useTranslations } from 'next-intl'
import { RichText } from '@/components/rich-text'
import { useEffect, useState, useRef } from 'react'

const processDescription = (text: string): string => {
  return text
    .replace(/\[BOLD\](.*?)\[\/BOLD\]/g, '<strong>$1</strong>')
    .replace(/\[BOOK_LINK\](.*?)\[\/BOOK_LINK\]/g, '<a href="#ebook" class="text-primary hover:opacity-80 transition-opacity underline">$1</a>')
    .replace(/\[PHOTO_LINK\](.*?)\[\/PHOTO_LINK\]/g, '<a href="https://instagram.com/miofotosba" target="_blank" rel="noopener noreferrer" class="text-primary hover:opacity-80 transition-opacity underline">$1</a>')
}

export function About() {
  const t = useTranslations('about')
  const [animatedValues, setAnimatedValues] = useState([0, 0, 0])
  const [hasAnimated, setHasAnimated] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    // Manejar clicks en enlaces internos
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault()
        const href = target.getAttribute('href')
        if (href) {
          scrollToSection(href.substring(1))
        }
      }
    }

    if (sectionRef.current) {
      sectionRef.current.addEventListener('click', handleClick)
    }

    return () => {
      if (sectionRef.current) {
        sectionRef.current.removeEventListener('click', handleClick)
      }
    }
  }, [])

  const stats = [
    { value: 15, suffix: '+', label: t('years') },
    { value: 500, suffix: '+', label: t('tours') },
    { value: 4.9, suffix: '', label: t('reviews') },
  ]

  useEffect(() => {
    if (hasAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
            
            const targetValues = [15, 500, 4.9]
            const duration = 2000 // 2 segundos
            const steps = 60
            const stepDuration = duration / steps
            
            const intervals: NodeJS.Timeout[] = []
            
            targetValues.forEach((targetValue, index) => {
              const increment = targetValue / steps
              let currentStep = 0
              
              const interval = setInterval(() => {
                currentStep++
                setAnimatedValues((prev) => {
                  const newValues = [...prev]
                  const newValue = Math.min(increment * currentStep, targetValue)
                  newValues[index] = newValue
                  return newValues
                })
                
                if (currentStep >= steps) {
                  clearInterval(interval)
                }
              }, stepDuration)
              
              intervals.push(interval)
            })
            
            return () => {
              intervals.forEach(interval => clearInterval(interval))
            }
          }
        })
      },
      { threshold: 0.5 }
    )

    const currentRef = sectionRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasAnimated])

  return (
    <section id="about" className="py-20 lg:py-32 bg-secondary" ref={sectionRef}>
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
                content={processDescription(t('description'))}
                className="whitespace-pre-line [&_a]:text-primary [&_a]:hover:opacity-80 [&_a]:transition-opacity [&_a]:underline [&_strong]:font-bold"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-card p-4 rounded-lg border border-border text-center"
                >
                  <div className="text-2xl md:text-3xl font-bold mb-1">
                    {stat.value === 4.9 
                      ? animatedValues[index].toFixed(1)
                      : Math.floor(animatedValues[index])
                    }{stat.suffix}
                  </div>
                  <div className="text-xs text-muted-foreground">
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

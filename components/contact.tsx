"use client"

import React from "react"
import { useState } from "react"
import { useTranslations } from 'next-intl'
import { trackGaEvent } from '@/lib/utils/gtag'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Send, Instagram, Facebook, Mail, Phone } from "lucide-react"
import { FaAirbnb } from "react-icons/fa"

export function Contact() {
  const t = useTranslations('contact')
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setSubmitError(data.error || 'Error al enviar. Intenta de nuevo.')
        return
      }

      // Recién acá hay un mensaje de verdad. Sin nombre ni email: GA4 no admite datos
      // personales, y para medir el canal alcanza con saber que alguien escribió.
      trackGaEvent('contacto_email', {
        origen: window.location.pathname,
      }).catch(() => {})

      setIsSubmitted(true)
      setFormData({ name: "", email: "", subject: "", message: "" })
      setTimeout(() => setIsSubmitted(false), 5000)
    } catch {
      setSubmitError('Error de conexión. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="py-16 lg:py-24 bg-secondary">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-sans text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
            {t('title')}
          </h2>
        </div>

        <div className="space-y-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  {t('form.name')}
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="!bg-white hover:!bg-white focus:!bg-white focus-visible:!bg-white border-border"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  {t('form.email')}
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="!bg-white hover:!bg-white focus:!bg-white focus-visible:!bg-white border-border"
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                  {t('form.subject')}
                </label>
                <Input
                  id="subject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  className="!bg-white hover:!bg-white focus:!bg-white focus-visible:!bg-white border-border"
                />
              </div>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                {t('form.message')}
              </label>
              <Textarea
                id="message"
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                className="!bg-white hover:!bg-white focus:!bg-white focus-visible:!bg-white border-border resize-none"
              />
            </div>
            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
            <div className="flex justify-end">
              <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting ? (
                  "..."
                ) : isSubmitted ? (
                  "✓"
                ) : (
                  <>
                    {t('form.send')}
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-6 md:gap-8 justify-center">
            <a
              href={`mailto:${t('info.email')}`}
              className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
            >
              <Mail className="h-5 w-5" />
              <span>{t('info.email')}</span>
            </a>

            <a
              href={`https://wa.me/${t('info.phone').replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
            >
              <Phone className="h-5 w-5" />
              <span>{t('info.phone')}</span>
            </a>

            <a
              href={`https://instagram.com/${t('info.instagram')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
            >
              <Instagram className="h-5 w-5" />
              <span>@{t('info.instagram')}</span>
            </a>

            <a
              href="https://www.airbnb.com.ar/experiences/35569"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
            >
              <FaAirbnb className="h-5 w-5 " />
              <span>Airbnb</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

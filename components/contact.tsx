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
import { AboutTexto, AboutVideo } from "@/components/about"

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
    // Sobre María y el contacto comparten sección (ver about.tsx): en desktop, el video a
    // la izquierda y el texto con el formulario a la derecha. En el celular se apilan en
    // el orden del DOM —texto, video, formulario—, y la grilla los reubica en desktop.
    // Cada parte conserva su id, así los links del menú siguen llevando a cada una.
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4 lg:px-8 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-x-12 lg:gap-y-8">
        <AboutTexto className="lg:col-start-2" />

        {/* En desktop acompaña el scroll: la columna de la derecha es mucho más alta. */}
        <div className="lg:col-start-1 lg:row-start-1 lg:row-span-2">
          <AboutVideo className="mx-auto max-w-[260px] lg:max-w-none lg:sticky lg:top-24" />
        </div>

        {/* Sin título: ya se sabe que es para escribir, y el menú trae hasta acá. */}
        <div id="contact" className="scroll-mt-24 lg:col-start-2 rounded-xl bg-secondary px-3 py-6 sm:p-5 md:p-8">
          <div className="space-y-8">
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

            <div className="flex flex-wrap items-center gap-x-6 gap-y-4 md:gap-8 justify-center text-sm md:text-base">
              <a
                href={`mailto:${t('info.email')}`}
                className="flex min-w-0 items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
              >
                <Mail className="h-5 w-5 shrink-0" />
                <span className="break-all">{t('info.email')}</span>
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
      </div>
    </section>
  )
}

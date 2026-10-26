"use client"

import React from "react"
import { useState } from "react"
import { useTranslations } from 'next-intl'
import { trackGaEvent } from '@/lib/utils/gtag'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Send, Instagram, Mail } from "lucide-react"
import { FaAirbnb, FaWhatsapp } from "react-icons/fa"
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

  const canales = [
    {
      href: `mailto:${t('info.email')}`,
      Icono: Mail,
      // Si no entra en un renglón, que se parta después de la arroba y no en cualquier letra.
      texto: <>{t('info.email').replace(/@.*/, '@')}<wbr />{t('info.email').replace(/^[^@]*@/, '')}</>,
      externo: false,
    },
    {
      href: `https://wa.me/${t('info.phone').replace(/[^0-9]/g, '')}`,
      Icono: FaWhatsapp,
      texto: t('info.phone'),
      externo: true,
    },
    {
      href: `https://instagram.com/${t('info.instagram')}`,
      Icono: Instagram,
      texto: `@${t('info.instagram')}`,
      externo: true,
    },
    { href: 'https://www.airbnb.com.ar/experiences/35569', Icono: FaAirbnb, texto: 'Airbnb', externo: true },
  ]

  return (
    // Sobre María y el contacto comparten sección (ver about.tsx): en desktop, el video a
    // la izquierda y el texto con el formulario a la derecha. En el celular se apilan en
    // el orden del DOM —texto, video, formulario—, y la grilla los reubica en desktop.
    // Cada parte conserva su id, así los links del menú siguen llevando a cada una.
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4 lg:px-8 grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-x-12 lg:gap-y-8">
        <AboutTexto className="lg:col-start-2" />

        {/* En desktop acompaña el scroll: la columna de la derecha es mucho más alta. */}
        <div className="lg:col-start-1 lg:row-start-1 lg:row-span-2">
          <AboutVideo className="mx-auto max-w-[340px] lg:max-w-none lg:sticky lg:top-24" />
        </div>

        {/* Sin título: ya se sabe que es para escribir, y el menú trae hasta acá. */}
        <div id="contact" className="scroll-mt-24 lg:col-start-2 rounded-xl bg-secondary px-3 py-6 sm:p-5 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre y email juntos, el asunto solo: en tres columnas los campos quedaban
                demasiado angostos para lo que se escribe en cada uno. */}
            <div className="grid sm:grid-cols-2 gap-4">
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
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                {t('form.message')}
              </label>
              {/* El botón al lado del mensaje, al pie: abajo, solo, ocupaba un renglón
                  entero. En el celular no hay ancho para los dos, y vuelve a ir debajo. */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Textarea
                  id="message"
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  className="flex-1 !bg-white hover:!bg-white focus:!bg-white focus-visible:!bg-white border-border resize-none"
                />
                <Button type="submit" className="w-full shrink-0 sm:w-auto" disabled={isSubmitting}>
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
            </div>
            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
          </form>

          {/* Los otros canales, separados del formulario y en grilla: sueltos en una fila
              centrada se partían en renglones desparejos según el ancho. */}
          <ul className="mt-6 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
            {canales.map(({ href, Icono, texto, externo }) => (
              <li key={href} className="min-w-0">
                <a
                  href={href}
                  {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="flex min-w-0 items-center gap-3 rounded-lg bg-background/60 p-3 text-sm text-foreground transition-colors hover:bg-background"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icono className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 [overflow-wrap:anywhere]">{texto}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

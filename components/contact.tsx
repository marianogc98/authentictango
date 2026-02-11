"use client"

import React from "react"
import { useState } from "react"
import { useTranslations } from 'next-intl'
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
    interestType: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
    setFormData({ name: "", email: "", subject: "", interestType: "", message: "" })
    
    setTimeout(() => setIsSubmitted(false), 5000)
  }

  return (
    <section id="contact" className="py-16 lg:py-24 bg-secondary">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
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
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="interestType" className="block text-sm font-medium text-foreground mb-2">
                  {t('form.interestType')}
                </label>
                <select
                  id="interestType"
                  value={formData.interestType}
                  onChange={(e) => setFormData({ ...formData, interestType: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring hover:bg-white focus:bg-white border-border"
                >
                  <option value="">{t('form.interestOption_placeholder')}</option>
                  <option value="educational">{t('form.interestOption_educational')}</option>
                  <option value="university">{t('form.interestOption_university')}</option>
                  <option value="corporate">{t('form.interestOption_corporate')}</option>
                  <option value="grupal">{t('form.interestOption_grupal')}</option>
                </select>
              </div>
              <div className="md:col-span-2">
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
            </div>
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

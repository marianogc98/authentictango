"use client"

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Instagram, Facebook, Mail } from "lucide-react"

export function Footer() {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const navLinks = [
    { id: 'about', label: tNav('about') },
    { id: 'tours', label: tNav('tours') },
    { id: 'gallery', label: tNav('gallery') },
    { id: 'map', label: tNav('map') },
    { id: 'booking', label: tNav('booking') },
    { id: 'contact', label: tNav('contact') },
  ]

  const socialLinks = [
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { icon: Mail, href: "mailto:info@buenosairestangotours.com", label: "Email" },
  ]

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="font-serif text-2xl font-bold text-foreground tracking-tight">
                Buenos Aires <span className="text-primary">Tango Tours</span>
              </span>
            </Link>
            <p className="text-muted-foreground max-w-md mb-6">
              Discover the authentic tango of Buenos Aires
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-serif font-bold text-foreground mb-4">{t('quickLinks')}</h3>
            <ul className="space-y-3">
              {navLinks.slice(0, 3).map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => scrollToSection(link.id)}
                    className="text-muted-foreground hover:text-primary transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif font-bold text-foreground mb-4">{t('legal')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('terms')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            {t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  )
}

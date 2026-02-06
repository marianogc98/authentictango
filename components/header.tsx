"use client"

import { useState, useEffect } from "react"
import { useTranslations, useLocale } from 'next-intl'
import { Link, useRouter, usePathname } from '@/i18n/navigation'
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleLanguage = () => {
    const newLocale = locale === 'es' ? 'en' : 'es'
    router.push(pathname, { locale: newLocale })
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMenuOpen(false)
    }
  }

  const navLinks = [
    { id: 'about', label: t('about') },
    { id: 'tours', label: t('tours') },
    { id: 'reviews', label: t('reviews') },
    { id: 'ebook', label: t('ebook') },
    { id: 'contact', label: t('contact') },
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled
        ? 'bg-background/80 backdrop-blur-md border-b border-border'
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-2">
            <span className={`font-sans text-xl lg:text-2xl font-bold tracking-tight transition-colors ${
              isScrolled ? 'text-foreground' : 'text-white'
            }`}>
              The Authentic <span className={isScrolled ? 'text-primary' : 'text-white'}>Tango Experience</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`text-sm font-medium transition-colors ${
                  isScrolled
                    ? 'text-muted-foreground hover:text-primary'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className={`text-sm px-3 py-1 border rounded hover:bg-opacity-20 transition-colors ${
                isScrolled
                  ? 'border-border hover:bg-card text-foreground'
                  : 'border-white/30 hover:bg-white/10 text-white'
              }`}
            >
              {locale === 'es' ? 'EN' : 'ES'}
            </button>
            <Button 
              onClick={() => scrollToSection('booking')}
              className={isScrolled ? '' : 'bg-white text-black hover:bg-white/90'}
            >
              {t('bookTour')}
            </Button>
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className={`text-sm px-2 py-1 border rounded text-xs transition-colors ${
                isScrolled
                  ? 'border-border text-foreground'
                  : 'border-white/30 text-white'
              }`}
            >
              {locale === 'es' ? 'EN' : 'ES'}
            </button>
            <button
              className={`p-2 transition-colors ${
                isScrolled ? 'text-foreground' : 'text-white'
              }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden bg-background border-t border-border">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-left text-base font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              >
                {link.label}
              </button>
            ))}
            <Button onClick={() => scrollToSection('booking')} className="mt-2">
              {t('bookTour')}
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}

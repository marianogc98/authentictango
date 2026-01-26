"use client"

import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer className="bg-black border-t border-gray-800">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white text-sm">
            {t('copyright')}
          </p>
          <p className="text-white text-sm">
            Diseño y desarrollo{' '}
            <a
              href="https://kudev.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:opacity-80 transition-opacity"
            >
              KUDev
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

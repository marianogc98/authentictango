"use client"

import { useTranslations } from 'next-intl'
import { FaWhatsapp } from "react-icons/fa"

export function WhatsappFlotante() {
  const t = useTranslations('contact')
  const numero = t('info.phone').replace(/[^0-9]/g, '')

  return (
    <a
      href={`https://wa.me/${numero}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('whatsapp')}
      title={t('whatsapp')}
      data-origen="boton_flotante"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
    >
      <FaWhatsapp className="h-7 w-7" />
    </a>
  )
}

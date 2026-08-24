'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { GA_MEASUREMENT_ID } from '@/lib/utils/gtag'

// En desarrollo no se carga: los datos de localhost ensucian la propiedad.
const ACTIVO = process.env.NODE_ENV === 'production' && !!GA_MEASUREMENT_ID

/**
 * Los clics salientes que GA4 registra por su cuenta no alcanzan: llegan como un evento
 * `click` genérico, y los `tel:`/`mailto:` ni siquiera cuentan como salientes.
 */
function nombreEvento(href: string) {
  if (/^tel:/i.test(href)) return 'contacto_telefono'
  if (/^mailto:/i.test(href)) return 'contacto_email'
  if (/wa\.me|whatsapp\.com/i.test(href)) return 'contacto_whatsapp'
  return null
}

export function GoogleAnalytics() {
  useEffect(() => {
    function alHacerClic(e: MouseEvent) {
      // Un botón de contacto suele ser un <svg>: el clic pega en el <path> de adentro.
      // Hay que subir con closest('a'), no mirar el target.
      const link = e.target instanceof Element ? e.target.closest('a') : null
      if (!link) return

      const evento = nombreEvento(link.getAttribute('href') ?? '')
      if (!evento) return

      window.gtag?.('event', evento, {
        origen: link.dataset.origen || window.location.pathname,
      })
    }

    document.addEventListener('click', alHacerClic)
    return () => document.removeEventListener('click', alHacerClic)
  }, [])

  if (!ACTIVO) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      {/* Las navegaciones internas del App Router las cubre la medición mejorada de GA4
          (page_view por cambio de historial): no hace falta código extra. */}
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  )
}

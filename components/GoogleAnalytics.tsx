'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { GA_MEASUREMENT_ID } from '@/lib/utils/gtag'

// En desarrollo no se carga: los datos de localhost ensucian la propiedad.
const ACTIVO = process.env.NODE_ENV === 'production' && !!GA_MEASUREMENT_ID

/**
 * WhatsApp es el único contacto que se mide por clic, y hace falta medirlo a mano: los
 * clics salientes que GA4 registra solo llegan como un evento `click` genérico.
 *
 * El mail no se mide acá. Antes se contaba el clic en la dirección, que sólo dice que
 * alguien la copió; el formulario emite `contacto_email` al enviarse, que es cuando de
 * verdad llegó un mensaje.
 */
const esWhatsapp = (href: string) => /wa\.me|whatsapp\.com/i.test(href)

export function GoogleAnalytics() {
  useEffect(() => {
    function alHacerClic(e: MouseEvent) {
      // Un botón de contacto suele ser un <svg>: el clic pega en el <path> de adentro.
      // Hay que subir con closest('a'), no mirar el target.
      const link = e.target instanceof Element ? e.target.closest('a') : null
      if (!link) return

      if (!esWhatsapp(link.getAttribute('href') ?? '')) return

      window.gtag?.('event', 'contacto_whatsapp', {
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

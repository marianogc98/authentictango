'use client'

import Script from 'next/script'

const UMAMI_READY_EVENT = 'umami-ready'
const SCRIPT_URL =
  process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? 'https://umami.kudev.cloud/script.js'
const WEBSITE_ID =
  process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? 'a44c82f1-e48e-48f9-8e6f-b33277cc1c0f'

export function Umami() {
  const onLoad = () => {
    setTimeout(() => {
      const u = typeof window !== 'undefined' && window.umami
      const hasTrack = u && (typeof u.track === 'function' || typeof u.trackEvent === 'function')
      if (hasTrack) {
        window.dispatchEvent(new Event(UMAMI_READY_EVENT))
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Umami cargado y listo')
        }
      }
    }, 200)
  }

  return (
    <Script
      src={SCRIPT_URL}
      data-website-id={WEBSITE_ID}
      strategy="afterInteractive"
      onLoad={onLoad}
    />
  )
}

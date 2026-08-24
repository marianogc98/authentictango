/**
 * Utilidades para Google Analytics 4 (gtag.js).
 * Uso: trackGaEvent('booking_confirmed', { locale: 'es' })
 */

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

// El Measurement ID no es secreto: viaja en el HTML igual. Se hardcodea como fallback
// porque las NEXT_PUBLIC_* se congelan en el build y una env faltante deja de medir en silencio.
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() || 'G-6B9G0CXFMM'

/**
 * Comprueba si gtag ya está inicializado en el cliente.
 * Devuelve false en SSR.
 */
export function isGaAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

/**
 * Espera a que gtag.js termine de cargar.
 * Resuelve false si no aparece (sin NEXT_PUBLIC_GA_ID, bloqueador de anuncios…).
 */
export function waitForGtag(maxAttempts = 30, delay = 100): Promise<boolean> {
  if (isGaAvailable()) return Promise.resolve(true)
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return Promise.resolve(false)

  return new Promise((resolve) => {
    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      if (isGaAvailable()) {
        clearInterval(interval)
        resolve(true)
      } else if (attempts >= maxAttempts) {
        clearInterval(interval)
        resolve(false)
      }
    }, delay)
  })
}

/**
 * Envía un evento a GA4 en cuanto gtag esté disponible.
 * Espera a la inicialización para que el evento no se encole antes del `config`.
 */
export async function trackGaEvent(
  name: string,
  params: Record<string, unknown> = {}
): Promise<boolean> {
  const ready = await waitForGtag()

  if (!ready) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[GA4] gtag no disponible, evento descartado:', name)
    }
    return false
  }

  // Quitamos claves vacías para no ensuciar los reportes
  const payload = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )

  window.gtag!('event', name, payload)

  if (process.env.NODE_ENV === 'development') {
    console.log('[GA4] evento enviado:', name, payload)
  }

  return true
}

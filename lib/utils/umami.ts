/**
 * Utilidades para Umami (analytics privado).
 * Uso: trackEvent('nombre_evento', { clave: 'valor' })
 */

declare global {
  interface Window {
    umami?: {
      track?: (eventName: string, eventData?: Record<string, string | number>) => void
      trackEvent?: (eventName: string, eventData?: Record<string, string | number>) => void
    }
    testUmami?: () => void
    umamiUtils?: {
      trackEvent: typeof trackEvent
      trackPublicidadView: typeof trackPublicidadView
      trackPublicidadClick: typeof trackPublicidadClick
      testUmami: typeof testUmami
    }
  }
}

const UMAMI_READY_EVENT = 'umami-ready'

function getUmamiTrack(): ((name: string, data?: Record<string, string | number>) => void) | null {
  if (typeof window === 'undefined') return null
  const u = window.umami
  if (!u) return null
  if (typeof u.track === 'function') return u.track.bind(u)
  if (typeof u.trackEvent === 'function') return u.trackEvent.bind(u)
  return null
}

/**
 * Comprueba si Umami está disponible en el cliente.
 * Devuelve false en SSR.
 */
export function isUmamiAvailable(): boolean {
  return getUmamiTrack() !== null
}

/**
 * Espera a que Umami cargue (evento umami-ready o polling).
 */
export function waitForUmami(maxAttempts = 15, delay = 100): Promise<void> {
  const track = getUmamiTrack()
  if (track) return Promise.resolve()

  return new Promise((resolve) => {
    const onReady = () => {
      window.removeEventListener(UMAMI_READY_EVENT, onReady)
      resolve()
    }
    window.addEventListener(UMAMI_READY_EVENT, onReady)

    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      if (getUmamiTrack()) {
        clearInterval(interval)
        window.removeEventListener(UMAMI_READY_EVENT, onReady)
        resolve()
        return
      }
      if (attempts >= maxAttempts) {
        clearInterval(interval)
        window.removeEventListener(UMAMI_READY_EVENT, onReady)
        resolve()
      }
    }, delay)
  })
}

/**
 * Envía un evento a Umami. Espera a que el script esté listo antes de enviar.
 */
export async function trackEvent(
  eventName: string,
  eventData?: Record<string, string | number>
): Promise<void> {
  await waitForUmami(15, 100)
  const track = getUmamiTrack()
  if (!track) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Umami] Script no disponible, evento no enviado:', eventName, eventData)
    }
    return
  }
  try {
    track(eventName, eventData)
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Umami] Error al enviar evento:', e)
    }
  }
}

/**
 * Envía evento de vista de publicidad (fire-and-forget).
 */
export function trackPublicidadView(
  publicidadId: string,
  titulo: string,
  posicion?: string
): void {
  trackEvent('publicidad_view', {
    publicidad_id: publicidadId,
    publicidad_titulo: titulo,
    ...(posicion && { publicidad_posicion: posicion }),
  }).catch(() => {})
}

/**
 * Envía evento de clic en publicidad (fire-and-forget).
 */
export function trackPublicidadClick(
  publicidadId: string,
  titulo: string,
  url: string,
  posicion?: string
): void {
  trackEvent('publicidad_click', {
    publicidad_id: publicidadId,
    publicidad_titulo: titulo,
    publicidad_url: url,
    ...(posicion && { publicidad_posicion: posicion }),
  }).catch(() => {})
}

/**
 * Prueba que Umami está cargado y envía un evento de prueba.
 * En desarrollo se expone en window.testUmami y window.umamiUtils.
 */
export function testUmami(): void {
  if (typeof window === 'undefined') return
  const available = isUmamiAvailable()
  if (process.env.NODE_ENV === 'development') {
    console.log('[Umami] Disponible:', available, 'window.umami:', !!window.umami)
  }
  trackEvent('test_event', { source: 'testUmami' })
}

if (typeof window !== 'undefined') {
  window.testUmami = testUmami
  window.umamiUtils = {
    trackEvent,
    trackPublicidadView,
    trackPublicidadClick,
    testUmami,
  }
}

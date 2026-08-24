/**
 * URL pública del sitio. Base de las URLs absolutas del sitemap, las canonical,
 * el hreflang y los tags Open Graph (WhatsApp e Instagram no aceptan rutas relativas).
 *
 * Se toma de la env, pero SÓLO si es una URL pública de verdad: en local esa variable
 * vale http://localhost:3000, y si ese valor se colara al build de producción el sitemap
 * y la imagen de compartir quedarían apuntando a una URL inalcanzable.
 *
 * El dominio real va hardcodeado como fallback a conciencia: no es un dato secreto y
 * evita que una variable mal configurada rompa el SEO en silencio.
 */
const DOMINIO = 'https://theauthentictangoexperience.com'

const configurada = process.env.NEXT_PUBLIC_SITE_URL?.trim()
const esPublica =
  !!configurada &&
  configurada.startsWith('https://') &&
  !/localhost|127\.0\.0\.1|\.local(:|$)/.test(configurada)

export const SITE_URL = (esPublica ? configurada : DOMINIO).replace(/\/$/, '')

/** Hostname sin protocolo, para comparar contra el header `host` en el middleware. */
export const SITE_HOST = new URL(SITE_URL).host

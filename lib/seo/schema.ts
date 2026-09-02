import { SITE_URL } from '@/lib/site'

/** Quita las claves nulas o vacías: es preferible un schema incompleto a uno que declare datos falsos. */
const limpiar = <T extends Record<string, unknown>>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null && v !== '')) as T

const TELEFONO = '+5491170632395'
const EMAIL = 'contact@theauthentictangoexperience.com'
const INSTAGRAM = 'https://www.instagram.com/theauthentictangoexperience'

/**
 * Negocio local. Se declaran los dos @type porque las dos cosas son ciertas:
 * es un comercio con dirección y es un atractivo turístico.
 *
 * No se emiten `openingHours` ni `priceRange` porque todavía no son datos confirmados.
 */
export function negocioSchema(locale: string) {
  return limpiar({
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'TouristAttraction'],
    '@id': `${SITE_URL}/#negocio`,
    name: 'The Authentic Tango Experience',
    url: SITE_URL,
    image: `${SITE_URL}/og.png`,
    telephone: TELEFONO,
    email: EMAIL,
    inLanguage: locale === 'es' ? 'es-AR' : 'en',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av. Corrientes 838',
      postalCode: 'C1043',
      addressLocality: 'Ciudad Autónoma de Buenos Aires',
      addressRegion: 'CABA',
      addressCountry: 'AR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -34.603636,
      longitude: -58.381158,
    },
    sameAs: [INSTAGRAM],
  })
}

/** Saca las marcas de formato del copy ([BOLD], [BOOK_LINK]…) y normaliza los espacios. */
function textoPlano(s: string): string {
  return s.replace(/\[\/?[A-Z_]+\]/g, '').replace(/\s+/g, ' ').trim()
}

export type OfertaSchema = {
  nombre: string
  /** En centavos de dólar, como se guarda en la base. */
  centavosUsd: number
}

/**
 * La experiencia en sí, que hasta ahora no estaba declarada en ningún lado: el sitio decía
 * qué negocio es, pero no qué vende.
 *
 * Va como `TouristTrip` colgado del mismo `@id` del negocio, así los dos nodos quedan
 * unidos en un solo grafo en vez de ser dos islas que Google tiene que adivinar que se
 * refieren a lo mismo.
 *
 * El precio entra por parámetro desde la base. Si no hay ninguno cargado se emite el nodo
 * sin `offers`: declarar un precio inventado sería peor que no declarar ninguno.
 *
 * No se emite la duración: `Trip` no tiene esa propiedad en schema.org y ensuciar el nodo
 * con una inválida no ayuda a nadie. Las 3 y 4 horas siguen estando en el texto de la
 * página, que es donde las lee tanto la persona como el que la resume.
 */
export function experienciaSchema(
  locale: string,
  { nombre, descripcion, ofertas }: { nombre: string; descripcion: string; ofertas: OfertaSchema[] },
) {
  return limpiar({
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    '@id': `${SITE_URL}/#experiencia`,
    name: nombre,
    description: textoPlano(descripcion),
    url: locale === 'es' ? `${SITE_URL}/es` : SITE_URL,
    image: `${SITE_URL}/og.png`,
    inLanguage: ['es-AR', 'en'],
    provider: { '@id': `${SITE_URL}/#negocio` },
    itinerary: {
      '@type': 'Place',
      name: 'Buenos Aires',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Ciudad Autónoma de Buenos Aires',
        addressCountry: 'AR',
      },
    },
    offers: ofertas.length
      ? ofertas.map((o) => ({
          '@type': 'Offer',
          name: o.nombre,
          price: (o.centavosUsd / 100).toFixed(2),
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: locale === 'es' ? `${SITE_URL}/es/reservar` : `${SITE_URL}/book`,
        }))
      : undefined,
  })
}

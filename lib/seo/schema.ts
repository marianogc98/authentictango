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

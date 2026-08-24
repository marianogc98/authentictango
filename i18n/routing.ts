import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // Muestra el locale solo cuando no es el default
  // Slugs por idioma: la página vive físicamente en /thank-you,
  // pero en español la URL es /gracias
  pathnames: {
    '/': '/',
    '/thank-you': {
      en: '/thank-you',
      es: '/gracias'
    },
    '/book': {
      en: '/book',
      es: '/reservar'
    },
    // Paso de pago de una reserva ya creada. Lleva el uid público, no el id
    // incremental: el id revelaría cuántas reservas hay en total.
    '/book/[uid]': {
      en: '/book/[uid]',
      es: '/reservar/[uid]'
    }
  }
});

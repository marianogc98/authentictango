import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // Obtener el locale de la request
  let locale = await requestLocale;

  // Si no hay locale o no es válido, usar el default
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // Cargar los mensajes para el locale
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});

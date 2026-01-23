import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async () => {
  // Para exportación estática, no podemos usar requestLocale (usa headers())
  // El locale se maneja completamente en el layout desde los parámetros de la ruta
  // Retornamos una configuración por defecto que será sobrescrita por NextIntlClientProvider
  const locale = routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});

import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async () => {
  // Para exportación estática, no usamos requestLocale (que usa headers())
  // El locale se maneja directamente en el layout desde los parámetros de la ruta
  const locale = routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});

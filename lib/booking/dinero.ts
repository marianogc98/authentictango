/**
 * Los importes se guardan en centavos como enteros. Estas funciones son el único puente
 * entre eso y lo que se escribe o se lee en pantalla: si la conversión queda desperdigada
 * por los componentes, tarde o temprano alguien multiplica por 100 dos veces.
 */

/** "45.50" -> 4550. Tolera coma decimal y separadores de miles. */
export function aCentavos(valor: string): number {
  const limpio = valor.trim().replace(/\s/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')
  const n = Number(limpio)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100)
}

/** 4550 -> "45.50". Para prellenar un input. */
export function aTexto(centavos: number): string {
  return (centavos / 100).toFixed(2)
}

/** Importe listo para mostrar, con el símbolo de la moneda. */
export function formatearPrecio(centavos: number, moneda: 'USD' | 'ARS', locale = 'es-AR'): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-AR', {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: moneda === 'ARS' ? 0 : 2,
  }).format(centavos / 100)
}

/** "15:00:00" -> "15:00" */
export function hhmm(time: string): string {
  return time.slice(0, 5)
}

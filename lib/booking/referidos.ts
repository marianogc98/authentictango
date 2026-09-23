/**
 * Links de referidos: quien entra por uno tiene un descuento sobre el total de lo que
 * reserve, por cualquier cantidad de lugares. Cada referido tiene un porcentaje para
 * dólares y otro para pesos, y se administran desde el panel (tabla `referrals`).
 *
 * El link se reconoce por su `utm_source` y queda guardado en una cookie. La cookie es lo
 * que hace que el descuento sobreviva a todo lo que pasa después de entrar: cambiar de
 * idioma (que arma una URL nueva sin los parámetros), navegar por la home o volver otro
 * día. Los UTM de la URL sólo sirven para el primer request.
 *
 * El middleware guarda cualquier `utm_source` con forma de código, sin consultar la base:
 * corre en cada request y en el runtime Edge. Quien decide si el código vale y cuánto
 * descuenta es el servidor, al cobrar (ver `descuento.ts`), así que ni un UTM inventado
 * ni una cookie editada dan descuento.
 *
 * Este archivo no toca la base a propósito: lo importan el middleware y el navegador.
 */

export const COOKIE_REFERIDO = 'ref'

/** Días que dura el descuento desde que se entró por el link. */
export const DIAS_REFERIDO = 5

/** Tope del porcentaje: por encima, un error de tipeo termina regalando el tour. */
export const PORCENTAJE_MAXIMO = 90

const FORMATO = /^[a-z0-9._-]{2,40}$/

/** Normaliza un código y lo devuelve si tiene forma de código, o null. No dice si existe. */
export function normalizarCodigo(valor: string | null | undefined): string | null {
  const codigo = valor?.trim().toLowerCase()
  return codigo && FORMATO.test(codigo) ? codigo : null
}

/**
 * Aplica el descuento a un importe en centavos.
 *
 * En pesos se redondea al peso entero, que es como se muestran los precios en ARS. Se
 * redondea hacia arriba: el descuento nunca puede terminar siendo mayor al prometido.
 */
export function conDescuento(centavos: number, porcentaje: number, moneda: 'USD' | 'ARS'): number {
  if (porcentaje <= 0) return centavos
  const unidad = moneda === 'ARS' ? 100 : 1
  return Math.ceil((centavos * (100 - porcentaje)) / 100 / unidad) * unidad
}

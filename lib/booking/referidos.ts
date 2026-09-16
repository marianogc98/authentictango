/**
 * Links de referidos: quien entra por uno tiene un descuento sobre el total de lo que
 * reserve, en cualquier moneda y por cualquier cantidad de lugares.
 *
 * El link se reconoce por su `utm_source` y queda guardado en una cookie. La cookie es lo
 * que hace que el descuento sobreviva a todo lo que pasa después de entrar: cambiar de
 * idioma (que arma una URL nueva sin los parámetros), navegar por la home o volver otro
 * día. Los UTM de la URL sólo sirven para el primer request.
 *
 * Sólo cuentan los códigos de esta lista. Cualquiera puede escribir `?utm_source=loquesea`
 * en la barra, y un UTM de una campaña paga tampoco tiene por qué dar descuento. El
 * servidor vuelve a validar contra esta lista al cobrar, así que editar la cookie a mano
 * no sirve para inventar un código ni para subir el porcentaje.
 *
 * Para sumar un referido nuevo alcanza con agregarlo acá: la clave es el `utm_source` del
 * link, en minúsculas.
 */
const REFERIDOS: Record<string, { porcentaje: number }> = {
  'lautaro.melcom': { porcentaje: 10 },
}

export const COOKIE_REFERIDO = 'ref'

/** Días que dura el descuento desde que se entró por el link. */
export const DIAS_REFERIDO = 5

/** Normaliza un código y devuelve el canónico si existe, o null. */
export function codigoValido(valor: string | null | undefined): string | null {
  const codigo = valor?.trim().toLowerCase()
  return codigo && Object.prototype.hasOwnProperty.call(REFERIDOS, codigo) ? codigo : null
}

/** Porcentaje de descuento de un código. 0 si no es un referido conocido. */
export function porcentajeDe(valor: string | null | undefined): number {
  const codigo = codigoValido(valor)
  return codigo ? REFERIDOS[codigo].porcentaje : 0
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

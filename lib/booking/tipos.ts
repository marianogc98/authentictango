/**
 * Forma pública de la disponibilidad: lo único que sale hacia el navegador.
 *
 * Vive acá y no en la ruta de API para que la puedan importar tanto la página como los
 * componentes, sin que `components/` termine importando desde `app/api/`.
 */
export type SlotPublico = {
  time: string
  seatsLeft: number
  priceUsd: number
  priceArs: number
  /** Lo que se suma por persona al elegir el tour con clase grupal. 0 = no se ofrece. */
  classPriceUsd: number
  classPriceArs: number
}

export type DiaPublico = {
  date: string
  slots: SlotPublico[]
}

/**
 * La ventana de reservas ya resuelta: entre qué fechas se acepta reservar.
 *
 * `desde` siempre tiene valor, porque el pasado nunca es reservable. `hasta` en null
 * es "sin fecha de corte".
 */
export type Ventana = { desde: string; hasta: string | null }

/** ¿La fecha "YYYY-MM-DD" cae dentro de la ventana? */
export function dentroDeVentana(date: string, v: Ventana): boolean {
  if (date < v.desde) return false
  if (v.hasta && date > v.hasta) return false
  return true
}

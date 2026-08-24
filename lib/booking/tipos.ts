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
}

export type DiaPublico = {
  date: string
  slots: SlotPublico[]
}

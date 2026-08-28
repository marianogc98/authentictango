import { db } from '@/lib/db/client'
import { bookingWindow } from '@/lib/db/schema'
import { hoyBA } from './tiempo'
import type { Ventana } from './tipos'

// El tipo y la regla de "cae dentro" viven en `tipos.ts`, que no toca la base: así los
// puede importar también el calendario del panel, que es un componente de cliente.
export { dentroDeVentana } from './tipos'
export type { Ventana } from './tipos'

/** Lo que hay guardado, tal cual, para el panel: null es null. */
export type VentanaGuardada = { startDate: string | null; endDate: string | null }

export async function ventanaGuardada(): Promise<VentanaGuardada> {
  const [fila] = await db.select().from(bookingWindow)
  return { startDate: fila?.startDate ?? null, endDate: fila?.endDate ?? null }
}

/**
 * La ventana efectiva de hoy. Una fecha de inicio en el pasado no adelanta nada:
 * el mínimo siempre es hoy, así que dejarla vieja equivale a no tener inicio.
 */
export async function getVentana(): Promise<Ventana> {
  const { startDate, endDate } = await ventanaGuardada()
  const hoy = hoyBA()
  return {
    desde: startDate && startDate > hoy ? startDate : hoy,
    hasta: endDate,
  }
}

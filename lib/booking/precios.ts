import type { Cotizacion } from '@/lib/cotizacion'
import { usdAPesos } from './dinero'

/** Lo mínimo que tiene que tener una fila de horario para poder convertirle los precios. */
export type ConPrecios = {
  priceUsd: number
  priceArs: number
  classPriceUsd: number
  classPriceArs: number
}

/**
 * Devuelve el horario con el precio en pesos calculado a partir del de dólares.
 *
 * Sin cotización devuelve el slot tal cual, es decir con el `price_ars` que quedó guardado
 * en la base la última vez que se configuró el horario. Es un precio viejo, pero es un
 * precio real y coherente: preferimos vender a la cotización de ayer que no vender.
 */
export function conPesos<T extends ConPrecios>(slot: T, cotizacion: Cotizacion | null): T {
  if (!cotizacion) return slot
  return {
    ...slot,
    priceArs: usdAPesos(slot.priceUsd, cotizacion.venta),
    classPriceArs: usdAPesos(slot.classPriceUsd, cotizacion.venta),
  }
}

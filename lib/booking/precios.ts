import type { Cotizacion } from '@/lib/cotizacion'
import { usdAPesos } from './dinero'

/** Lo mínimo que tiene que tener una fila de horario para poder convertirle los precios. */
export type ConPrecios = {
  priceUsd: number
  priceArs: number
  classPriceUsd: number
  classPriceArs: number
}

/** Las dos experiencias que se venden en un mismo horario, cada una por su cuenta. */
export type Producto = 'tour' | 'clase'

/**
 * El precio por persona de una experiencia en una moneda, en centavos.
 *
 * Cero significa que ese horario no vende esa experiencia. Los dos productos son
 * independientes: el precio de la clase grupal es lo que sale la clase grupal, no un
 * adicional del tour, así que un horario puede vender sólo una de las dos.
 */
export function precioDe(slot: ConPrecios, producto: Producto, moneda: 'USD' | 'ARS'): number {
  if (producto === 'clase') return moneda === 'USD' ? slot.classPriceUsd : slot.classPriceArs
  return moneda === 'USD' ? slot.priceUsd : slot.priceArs
}

/** ¿Este horario vende esa experiencia en alguna moneda? */
export function seVende(slot: ConPrecios, producto: Producto): boolean {
  return precioDe(slot, producto, 'USD') > 0 || precioDe(slot, producto, 'ARS') > 0
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

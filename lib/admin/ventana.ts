'use server'

import { and, gt, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db/client'
import { bookings, bookingWindow } from '@/lib/db/schema'
import { hoyBA } from '@/lib/booking/tiempo'

const FECHA = /^\d{4}-\d{2}-\d{2}$/

/** Un string vacío del formulario es "sin fecha", no una fecha inválida. */
function normalizar(v: string | null | undefined): string | null {
  const s = (v ?? '').trim()
  return s === '' ? null : s
}

export type ResultadoVentana =
  | { ok: true; startDate: string | null; endDate: string | null; pagasAfuera: number }
  | { ok: false; error: 'fecha_invalida' | 'rango_invalido' | 'fin_pasado' }

/**
 * Cuántas reservas PAGAS quedarían fuera de la ventana nueva.
 *
 * No bloquea nada: la ventana decide qué se puede reservar de acá en adelante, no borra
 * lo ya vendido. Pero conviene decirlo, porque el calendario va a seguir mostrando esas
 * reservas en días que la web ya no ofrece, y sin este aviso parece un error.
 */
async function pagasFueraDe(startDate: string | null, endDate: string | null): Promise<number> {
  const desde = startDate && startDate > hoyBA() ? startDate : hoyBA()

  const [r] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(bookings)
    .where(and(
      eq(bookings.status, 'paid'),
      gt(bookings.date, hoyBA()),
      endDate
        ? sql`(${bookings.date} < ${desde} OR ${bookings.date} > ${endDate})`
        : sql`${bookings.date} < ${desde}`,
    ))
  return Number(r?.n ?? 0)
}

/**
 * Guarda la ventana de reservas. Las dos fechas son opcionales: sin inicio se toma hoy,
 * y sin fin no hay corte.
 */
export async function guardarVentana(
  start: string | null,
  end: string | null,
): Promise<ResultadoVentana> {
  const startDate = normalizar(start)
  const endDate = normalizar(end)

  if ((startDate && !FECHA.test(startDate)) || (endDate && !FECHA.test(endDate))) {
    return { ok: false, error: 'fecha_invalida' }
  }
  if (startDate && endDate && startDate > endDate) {
    return { ok: false, error: 'rango_invalido' }
  }
  // Una fecha de corte ya pasada deja la web sin ningún día reservable. Casi siempre es
  // un año mal tipeado; si de verdad quiere frenar todo, el corte es hoy.
  if (endDate && endDate < hoyBA()) {
    return { ok: false, error: 'fin_pasado' }
  }

  const pagasAfuera = await pagasFueraDe(startDate, endDate)

  await db
    .insert(bookingWindow)
    .values({ id: 1, startDate, endDate, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: bookingWindow.id,
      set: { startDate, endDate, updatedAt: new Date() },
    })

  revalidatePath('/admin')
  return { ok: true, startDate, endDate, pagasAfuera }
}

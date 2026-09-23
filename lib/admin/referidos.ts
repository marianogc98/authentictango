'use server'

import { asc, eq, sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db/client'
import { bookings, referrals } from '@/lib/db/schema'
import { COOKIE, sesionValida } from '@/lib/admin/auth'
import { PORCENTAJE_MAXIMO, normalizarCodigo } from '@/lib/booking/referidos'

export type FilaReferido = {
  code: string
  percentUsd: number
  percentArs: number
  active: boolean
  /** Reservas pagas que entraron por este link, y lo que se cobró en cada moneda. */
  pagas: number
  usd: number
  ars: number
}

export type ResultadoReferido =
  | { ok: true }
  | { ok: false; error: 'sin_sesion' | 'codigo_invalido' | 'porcentaje_invalido' | 'ya_existe' | 'tiene_reservas' }

/**
 * Un server action es un endpoint público: el layout del panel protege las páginas,
 * no las acciones. Sin esto, cualquiera que tenga el id de la acción podría crearse un
 * referido con el descuento máximo.
 */
async function conSesion(): Promise<boolean> {
  return sesionValida((await cookies()).get(COOKIE)?.value)
}

function porcentajeValido(n: number): boolean {
  return Number.isInteger(n) && n >= 0 && n <= PORCENTAJE_MAXIMO
}

export async function listarReferidos(): Promise<FilaReferido[]> {
  if (!(await conSesion())) return []

  const filas = await db
    .select({
      code: referrals.code,
      percentUsd: referrals.percentUsd,
      percentArs: referrals.percentArs,
      active: referrals.active,
      pagas: sql<number>`COUNT(${bookings.id})::int`,
      usd: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.currency} = 'USD' THEN ${bookings.amount} END), 0)::int`,
      ars: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.currency} = 'ARS' THEN ${bookings.amount} END), 0)::int`,
    })
    .from(referrals)
    .leftJoin(bookings, sql`${bookings.referral} = ${referrals.code} AND ${bookings.status} = 'paid'`)
    .groupBy(referrals.code)
    .orderBy(asc(referrals.code))

  return filas.map((f) => ({ ...f, pagas: Number(f.pagas), usd: Number(f.usd), ars: Number(f.ars) }))
}

export async function crearReferido(
  codigo: string,
  percentUsd: number,
  percentArs: number,
): Promise<ResultadoReferido> {
  if (!(await conSesion())) return { ok: false, error: 'sin_sesion' }

  const code = normalizarCodigo(codigo)
  if (!code) return { ok: false, error: 'codigo_invalido' }
  if (!porcentajeValido(percentUsd) || !porcentajeValido(percentArs)) {
    return { ok: false, error: 'porcentaje_invalido' }
  }

  const creadas = await db
    .insert(referrals)
    .values({ code, percentUsd, percentArs })
    .onConflictDoNothing()
    .returning({ code: referrals.code })
  if (creadas.length === 0) return { ok: false, error: 'ya_existe' }

  revalidatePath('/admin/referidos')
  return { ok: true }
}

export async function guardarReferido(
  code: string,
  cambios: { percentUsd: number; percentArs: number; active: boolean },
): Promise<ResultadoReferido> {
  if (!(await conSesion())) return { ok: false, error: 'sin_sesion' }
  if (!porcentajeValido(cambios.percentUsd) || !porcentajeValido(cambios.percentArs)) {
    return { ok: false, error: 'porcentaje_invalido' }
  }

  await db
    .update(referrals)
    .set({
      percentUsd: cambios.percentUsd,
      percentArs: cambios.percentArs,
      active: Boolean(cambios.active),
    })
    .where(eq(referrals.code, code))

  revalidatePath('/admin/referidos')
  return { ok: true }
}

/**
 * Borrar sólo sirve para corregir un código mal tipeado. Si ya trajo alguna reserva, de
 * cualquier estado, se desactiva en vez de borrarse: esas reservas lo nombran y sin la
 * fila no queda registro de su porcentaje.
 */
export async function borrarReferido(code: string): Promise<ResultadoReferido> {
  if (!(await conSesion())) return { ok: false, error: 'sin_sesion' }

  const [{ n }] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(bookings)
    .where(eq(bookings.referral, code))
  if (Number(n) > 0) return { ok: false, error: 'tiene_reservas' }

  await db.delete(referrals).where(eq(referrals.code, code))
  revalidatePath('/admin/referidos')
  return { ok: true }
}

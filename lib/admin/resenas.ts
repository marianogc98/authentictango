'use server'

import { desc, eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db/client'
import { reviews } from '@/lib/db/schema'
import { COOKIE, sesionValida } from '@/lib/admin/auth'

export type FilaResena = {
  id: number
  name: string
  rating: number
  /** "2025-12": lo que usa un <input type="month">. */
  mes: string
  textEs: string
  textEn: string
  visible: boolean
}

export type DatosResena = Omit<FilaResena, 'id'>

export type ResultadoResena =
  | { ok: true }
  | { ok: false; error: 'sin_sesion' | 'sin_nombre' | 'estrellas_invalidas' | 'mes_invalido' | 'sin_texto' }

/** Un server action es un endpoint público: el layout protege la página, no la acción. */
async function conSesion(): Promise<boolean> {
  return sesionValida((await cookies()).get(COOKIE)?.value)
}

/** Valida y deja los datos listos para la base, o dice qué está mal. */
function normalizar(d: DatosResena):
  | { ok: true; fila: Omit<typeof reviews.$inferInsert, 'id' | 'createdAt'> }
  | { ok: false; error: Exclude<Extract<ResultadoResena, { ok: false }>['error'], 'sin_sesion'> } {
  const name = String(d.name ?? '').trim()
  if (!name) return { ok: false, error: 'sin_nombre' }

  const rating = Number(d.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, error: 'estrellas_invalidas' }

  const mes = String(d.mes ?? '')
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) return { ok: false, error: 'mes_invalido' }

  // Las dos traducciones son obligatorias: una reseña sin texto en un idioma se vería
  // como una tarjeta vacía en esa versión de la web.
  const textEs = String(d.textEs ?? '').trim()
  const textEn = String(d.textEn ?? '').trim()
  if (!textEs || !textEn) return { ok: false, error: 'sin_texto' }

  return { ok: true, fila: { name, rating, date: `${mes}-01`, textEs, textEn, visible: Boolean(d.visible) } }
}

/** La home se cachea: sin esto, un cambio tardaría hasta un minuto en verse. */
function refrescar() {
  revalidatePath('/admin/resenas')
  revalidatePath('/[locale]', 'page')
}

export async function listarResenas(): Promise<FilaResena[]> {
  if (!(await conSesion())) return []

  const filas = await db.select().from(reviews).orderBy(desc(reviews.date), desc(reviews.id))
  return filas.map((r) => ({
    id: r.id,
    name: r.name,
    rating: r.rating,
    mes: r.date.slice(0, 7),
    textEs: r.textEs,
    textEn: r.textEn,
    visible: r.visible,
  }))
}

export async function crearResena(datos: DatosResena): Promise<ResultadoResena> {
  if (!(await conSesion())) return { ok: false, error: 'sin_sesion' }
  const r = normalizar(datos)
  if (!r.ok) return r

  await db.insert(reviews).values(r.fila)
  refrescar()
  return { ok: true }
}

export async function guardarResena(id: number, datos: DatosResena): Promise<ResultadoResena> {
  if (!(await conSesion())) return { ok: false, error: 'sin_sesion' }
  const r = normalizar(datos)
  if (!r.ok) return r

  await db.update(reviews).set(r.fila).where(eq(reviews.id, id))
  refrescar()
  return { ok: true }
}

export async function borrarResena(id: number): Promise<ResultadoResena> {
  if (!(await conSesion())) return { ok: false, error: 'sin_sesion' }

  await db.delete(reviews).where(eq(reviews.id, id))
  refrescar()
  return { ok: true }
}

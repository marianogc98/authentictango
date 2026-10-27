'use server'

import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { asc, eq, sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db/client'
import { galleryImages } from '@/lib/db/schema'
import { COOKIE, sesionValida } from '@/lib/admin/auth'
import { NOMBRE_MEDIA, RUTA_MEDIA, carpetaMedia } from '@/lib/media'

export type FilaImagen = { id: number; src: string; youtubeId: string | null; altEs: string; altEn: string }

export type ResultadoImagen =
  | { ok: true }
  | { ok: false; error: 'sin_sesion' | 'sin_volumen' | 'archivo_invalido' | 'muy_grande' | 'link_invalido' }

/** El panel achica las fotos antes de mandarlas; esto es sólo el tope por si no lo hace. */
const BYTES_MAXIMOS = 8 * 1024 * 1024

/** Un server action es un endpoint público: el layout protege la página, no la acción. */
async function conSesion(): Promise<boolean> {
  return sesionValida((await cookies()).get(COOKIE)?.value)
}

function refrescar() {
  revalidatePath('/admin/galeria')
  revalidatePath('/[locale]', 'page')
}

export async function listarImagenes(): Promise<FilaImagen[]> {
  if (!(await conSesion())) return []
  return db
    .select({ id: galleryImages.id, src: galleryImages.src, youtubeId: galleryImages.youtubeId, altEs: galleryImages.altEs, altEn: galleryImages.altEn })
    .from(galleryImages)
    .orderBy(asc(galleryImages.position), asc(galleryImages.id))
}

/**
 * Sube una foto y la agrega al final de la galería.
 *
 * Sólo acepta JPG, que es lo que produce el panel al achicarla. Se mira el contenido y no
 * sólo el tipo que declara el navegador: el tipo lo manda el cliente y puede decir
 * cualquier cosa.
 */
export async function subirImagen(form: FormData): Promise<ResultadoImagen> {
  if (!(await conSesion())) return { ok: false, error: 'sin_sesion' }

  const dir = carpetaMedia()
  if (!dir) return { ok: false, error: 'sin_volumen' }

  const archivo = form.get('archivo')
  if (!(archivo instanceof File)) return { ok: false, error: 'archivo_invalido' }
  if (archivo.size > BYTES_MAXIMOS) return { ok: false, error: 'muy_grande' }

  const datos = Buffer.from(await archivo.arrayBuffer())
  const esJpeg = datos.length > 3 && datos[0] === 0xff && datos[1] === 0xd8 && datos[2] === 0xff
  if (!esJpeg) return { ok: false, error: 'archivo_invalido' }

  const nombre = `${randomUUID()}.jpg`
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, nombre), datos)

  const altEs = String(form.get('altEs') ?? '').trim()
  const altEn = String(form.get('altEn') ?? '').trim()
  await db.insert(galleryImages).values({
    src: `${RUTA_MEDIA}${nombre}`,
    altEs,
    altEn,
    position: sql`(SELECT COALESCE(MAX(${galleryImages.position}), 0) + 1 FROM ${galleryImages})`,
  })

  refrescar()
  return { ok: true }
}

/**
 * Saca el id de un link de YouTube, en cualquiera de las formas en que se comparte:
 * youtu.be/ID, watch?v=ID, /shorts/ID, /embed/ID, /live/ID. El id son siempre 11
 * caracteres; se valida para no meter en la página cualquier cosa que peguen.
 */
function idDeYoutube(link: string): string | null {
  let url: URL
  try {
    url = new URL(link.trim().replace(/^(?!https?:\/\/)/, 'https://'))
  } catch {
    return null
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, '')
  let id: string | null = null
  if (host === 'youtu.be') id = url.pathname.split('/')[1] ?? null
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = url.searchParams.get('v') ?? url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ?? null
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null
}

/** Agrega un video de YouTube al final de la galería. No ocupa el volumen: se embebe. */
export async function agregarVideo(link: string, altEs: string, altEn: string): Promise<ResultadoImagen> {
  if (!(await conSesion())) return { ok: false, error: 'sin_sesion' }

  const id = idDeYoutube(String(link))
  if (!id) return { ok: false, error: 'link_invalido' }

  await db.insert(galleryImages).values({
    src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    youtubeId: id,
    altEs: String(altEs).trim(),
    altEn: String(altEn).trim(),
    position: sql`(SELECT COALESCE(MAX(${galleryImages.position}), 0) + 1 FROM ${galleryImages})`,
  })

  refrescar()
  return { ok: true }
}

/** El texto alternativo: lo que lee un lector de pantalla y lo que entiende Google de la foto. */
export async function guardarImagen(id: number, altEs: string, altEn: string): Promise<ResultadoImagen> {
  if (!(await conSesion())) return { ok: false, error: 'sin_sesion' }

  await db
    .update(galleryImages)
    .set({ altEs: String(altEs).trim(), altEn: String(altEn).trim() })
    .where(eq(galleryImages.id, id))

  refrescar()
  return { ok: true }
}

/**
 * Mueve una foto un lugar hacia adelante o hacia atrás. Se renumera la galería entera en
 * vez de intercambiar dos posiciones: así un orden con huecos o empates —por ejemplo,
 * dos fotos subidas a la vez— se arregla solo la primera vez que se toca.
 */
export async function moverImagen(id: number, hacia: 'antes' | 'despues'): Promise<ResultadoImagen> {
  if (!(await conSesion())) return { ok: false, error: 'sin_sesion' }

  await db.transaction(async (tx) => {
    const filas = await tx
      .select({ id: galleryImages.id })
      .from(galleryImages)
      .orderBy(asc(galleryImages.position), asc(galleryImages.id))
    const ids = filas.map((f) => f.id)

    const i = ids.indexOf(id)
    const j = hacia === 'antes' ? i - 1 : i + 1
    if (i < 0 || j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]

    for (const [posicion, idFila] of ids.entries()) {
      await tx.update(galleryImages).set({ position: posicion + 1 }).where(eq(galleryImages.id, idFila))
    }
  })

  refrescar()
  return { ok: true }
}

/**
 * Saca la foto de la galería y, si la había subido ella, borra el archivo del volumen.
 * Las que vinieron con el sitio quedan en /public: no se pueden borrar del disco, y
 * tampoco ocupan el volumen.
 */
export async function borrarImagen(id: number): Promise<ResultadoImagen> {
  if (!(await conSesion())) return { ok: false, error: 'sin_sesion' }

  const [borrada] = await db
    .delete(galleryImages)
    .where(eq(galleryImages.id, id))
    .returning({ src: galleryImages.src })

  const dir = carpetaMedia()
  const nombre = borrada?.src.startsWith(RUTA_MEDIA) ? borrada.src.slice(RUTA_MEDIA.length) : null
  if (dir && nombre && NOMBRE_MEDIA.test(nombre)) {
    // Si el archivo ya no estaba, da igual: lo que importa es que salga de la galería.
    await unlink(path.join(dir, nombre)).catch(() => {})
  }

  refrescar()
  return { ok: true }
}

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NOMBRE_MEDIA, carpetaMedia } from '@/lib/media'

/**
 * Sirve las fotos subidas desde el panel, que viven en el volumen y no en /public.
 *
 * El nombre se valida contra el patrón exacto antes de tocar el disco: sin eso, un
 * `../` en la URL podría leer cualquier archivo del servidor.
 *
 * Cada archivo tiene un nombre único y nunca se reescribe —reemplazar una foto es subir
 * otra—, así que puede cachearse para siempre.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ archivo: string }> }) {
  const { archivo } = await params
  const dir = carpetaMedia()
  if (!dir || !NOMBRE_MEDIA.test(archivo)) {
    return new Response('No encontrado', { status: 404 })
  }

  try {
    const datos = await readFile(path.join(dir, archivo))
    return new Response(new Uint8Array(datos), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new Response('No encontrado', { status: 404 })
  }
}

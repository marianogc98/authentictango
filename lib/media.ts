import path from 'node:path'

/**
 * Dónde viven las fotos que se suben desde el panel.
 *
 * En producción tiene que ser un volumen montado en el contenedor, indicado en MEDIA_DIR:
 * todo lo que se escriba fuera de un volumen se pierde con el próximo deploy. Por eso, si
 * falta la variable en producción, no hay carpeta y las subidas fallan con un aviso, en
 * vez de guardarse en un lugar que desaparece sin que nadie se entere.
 *
 * En desarrollo, sin la variable, se usa `.media` dentro del proyecto.
 */
export function carpetaMedia(): string | null {
  const dir = process.env.MEDIA_DIR?.trim()
  if (dir) return dir
  return process.env.NODE_ENV === 'production' ? null : path.join(process.cwd(), '.media')
}

/** Los archivos subidos se llaman siempre `<uuid>.jpg`: el panel los convierte a JPG. */
export const NOMBRE_MEDIA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/

/** Prefijo público de las fotos subidas. */
export const RUTA_MEDIA = '/media/'

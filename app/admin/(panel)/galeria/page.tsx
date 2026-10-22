import { listarImagenes } from '@/lib/admin/galeria'
import { carpetaMedia } from '@/lib/media'
import { AdminNav } from '../../nav'
import { ListaImagenes, SubirImagenes } from './galeria'

export const dynamic = 'force-dynamic'

export default async function GaleriaPage() {
  const filas = await listarImagenes()
  const conVolumen = carpetaMedia() !== null

  return (
    <>
      <AdminNav activo="galeria" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold">Galería</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Las fotos de la galería de la web, en este orden. La primera sale más grande.
            Las fotos se achican antes de subirse, así que se puede subir directo desde el
            celular. La descripción no se ve, pero la leen Google y quienes navegan con
            lector de pantalla.
          </p>
        </div>

        {conVolumen ? (
          <SubirImagenes />
        ) : (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            Falta configurar dónde se guardan las fotos (MEDIA_DIR). Hasta entonces no se
            pueden subir fotos nuevas, pero sí ordenar y borrar las que hay.
          </p>
        )}
        <ListaImagenes filas={filas} />
      </main>
    </>
  )
}

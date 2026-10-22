import { listarResenas } from '@/lib/admin/resenas'
import { AdminNav } from '../../nav'
import { ListaResenas, NuevaResena } from './resenas'

export const dynamic = 'force-dynamic'

export default async function ResenasPage() {
  const filas = await listarResenas()

  return (
    <>
      <AdminNav activo="resenas" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold">Reseñas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Las que se ven en la web, de la más nueva a la más vieja según el mes. Cada una
            lleva el texto en español y en inglés, y se muestra en el idioma de quien la lee.
            Ocultar una la saca de la web sin perder el texto.
          </p>
        </div>

        <NuevaResena />
        <ListaResenas filas={filas} />
      </main>
    </>
  )
}

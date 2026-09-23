import { listarReferidos } from '@/lib/admin/referidos'
import { SITE_URL } from '@/lib/site'
import { AdminNav } from '../../nav'
import { NuevoReferido, TablaReferidos } from './referidos'

export const dynamic = 'force-dynamic'

export default async function ReferidosPage() {
  const filas = await listarReferidos()

  return (
    <>
      <AdminNav activo="referidos" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold">Referidos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada referido tiene un link propio. Quien entra por ese link tiene el descuento
            durante 5 días sobre el total de lo que reserve. Cada moneda tiene su propio
            porcentaje; en 0 no hay descuento pagando así, pero la venta igual queda anotada
            a su nombre.
          </p>
        </div>

        <NuevoReferido sitio={SITE_URL} />
        <TablaReferidos filas={filas} sitio={SITE_URL} />
      </main>
    </>
  )
}

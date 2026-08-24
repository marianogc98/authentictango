import { db } from '@/lib/db/client'
import { weeklySlots } from '@/lib/db/schema'
import { aTexto, hhmm } from '@/lib/booking/dinero'
import { AdminNav } from '../../nav'
import { EditorSemana, type SlotUI } from './editor'

// Nunca prerenderizar: depende de la base, que en el build ni siquiera es alcanzable.
export const dynamic = 'force-dynamic'

export default async function SemanaPage() {
  const filas = await db.select().from(weeklySlots)

  const semana: Record<number, SlotUI[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  for (const f of filas) {
    semana[f.weekday].push({
      time: hhmm(f.time),
      seats: f.seats,
      priceUsd: aTexto(f.priceUsd),
      priceArs: aTexto(f.priceArs),
    })
  }
  for (const d of Object.keys(semana)) {
    semana[Number(d)].sort((a, b) => a.time.localeCompare(b.time))
  }

  return (
    <>
      <AdminNav activo="semana" />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Mi semana</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Los horarios habituales. Se configura una vez y después sólo cargás las
            excepciones en el calendario.
          </p>
        </div>
        <EditorSemana inicial={semana} />
      </main>
    </>
  )
}

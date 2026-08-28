import { db } from '@/lib/db/client'
import { weeklySlots } from '@/lib/db/schema'
import { getMonthAvailability } from '@/lib/booking/availability'
import { aTexto, hhmm } from '@/lib/booking/dinero'
import { hoyBA } from '@/lib/booking/tiempo'
import { getVentana, ventanaGuardada } from '@/lib/booking/ventana'
import { AdminNav } from '../nav'
import { Calendario } from './calendario'
import { SeccionSemana, type SlotUI } from './semana'
import { SeccionVentana } from './ventana'

export const dynamic = 'force-dynamic'

/** La plantilla semanal con la forma que espera el editor: por día y ya ordenada. */
async function semanaParaEditor(): Promise<Record<number, SlotUI[]>> {
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
  return semana
}

/**
 * El panel entero en una sola pantalla.
 *
 * El calendario es lo que se abre todos los días; el período va pegado abajo porque es
 * lo que explica los días atenuados, y la semana —que se toca una vez y después casi
 * nunca— queda plegada al final.
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>
}) {
  const { m } = await searchParams
  const hoy = hoyBA()

  // "2026-09" por querystring; si no viene o es inválido, el mes actual en Buenos Aires.
  const valido = m && /^\d{4}-\d{2}$/.test(m) ? m : hoy.slice(0, 7)
  const [year, month] = valido.split('-').map(Number)

  const [dias, ventana, guardada, semana] = await Promise.all([
    getMonthAvailability(year, month),
    getVentana(),
    ventanaGuardada(),
    semanaParaEditor(),
  ])

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <Calendario year={year} month={month} dias={dias} hoy={hoy} ventana={ventana} />
        <SeccionVentana inicial={guardada} hoy={hoy} />
        <SeccionSemana inicial={semana} />
      </main>
    </>
  )
}

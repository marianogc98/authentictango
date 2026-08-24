import { getMonthAvailability } from '@/lib/booking/availability'
import { hoyBA } from '@/lib/booking/tiempo'
import { AdminNav } from '../nav'
import { Calendario } from './calendario'

export const dynamic = 'force-dynamic'

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

  const dias = await getMonthAvailability(year, month)

  return (
    <>
      <AdminNav activo="calendario" />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Calendario year={year} month={month} dias={dias} hoy={hoy} />
      </main>
    </>
  )
}

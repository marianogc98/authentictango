import { NextResponse } from 'next/server'
import { getMonthAvailability } from '@/lib/booking/availability'
import { hoyBA } from '@/lib/booking/tiempo'

// La disponibilidad cambia con cada reserva: nunca se cachea.
export const dynamic = 'force-dynamic'

/** Meses hacia adelante que se pueden consultar. Evita que un script pida el año 9999. */
const MESES_ADELANTE = 18

export type SlotPublico = {
  time: string
  seatsLeft: number
  priceUsd: number
  priceArs: number
}

export type DiaPublico = {
  date: string
  slots: SlotPublico[]
}

/**
 * GET /api/availability?m=YYYY-MM
 *
 * Devuelve sólo lo reservable. Un horario sin precio no se ofrece: mientras los importes
 * estén en cero, el día aparece sin turnos en vez de dejar reservar gratis.
 *
 * Los horarios completos SÍ se devuelven (con seatsLeft en 0) para poder mostrarlos
 * agotados, que informa más que esconderlos.
 */
export async function GET(request: Request) {
  const m = new URL(request.url).searchParams.get('m') ?? ''
  const hoy = hoyBA()

  const pedido = /^\d{4}-(0[1-9]|1[0-2])$/.test(m) ? m : hoy.slice(0, 7)

  // Ni meses ya pasados ni un futuro arbitrario.
  const limite = new Date(Date.UTC(Number(hoy.slice(0, 4)), Number(hoy.slice(5, 7)) - 1 + MESES_ADELANTE, 1))
  const maximo = `${limite.getUTCFullYear()}-${String(limite.getUTCMonth() + 1).padStart(2, '0')}`
  const mes = pedido < hoy.slice(0, 7) ? hoy.slice(0, 7) : pedido > maximo ? maximo : pedido

  const [year, month] = mes.split('-').map(Number)

  try {
    const dias = await getMonthAvailability(year, month)

    const publico: DiaPublico[] = dias.map((d) => ({
      date: d.date,
      slots: d.closed
        ? []
        : d.slots
            .filter((s) => !s.past && (s.priceUsd > 0 || s.priceArs > 0))
            .map((s) => ({
              time: s.time,
              seatsLeft: s.seatsLeft,
              priceUsd: s.priceUsd,
              priceArs: s.priceArs,
            })),
    }))

    return NextResponse.json({ month: mes, today: hoy, days: publico }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('[availability] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
}

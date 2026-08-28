import { NextResponse } from 'next/server'
import { getMonthAvailability } from '@/lib/booking/availability'
import { hoyBA } from '@/lib/booking/tiempo'
import { dentroDeVentana, getVentana } from '@/lib/booking/ventana'
import type { DiaPublico } from '@/lib/booking/tipos'

// La disponibilidad cambia con cada reserva: nunca se cachea.
export const dynamic = 'force-dynamic'

/** Meses hacia adelante que se pueden consultar. Evita que un script pida el año 9999. */
const MESES_ADELANTE = 18


/**
 * GET /api/availability?m=YYYY-MM
 *
 * Devuelve sólo lo reservable. Un horario sin precio no se ofrece: mientras los importes
 * estén en cero, el día aparece sin turnos en vez de dejar reservar gratis. Lo mismo
 * pasa con los días fuera de la ventana de reservas: existen en el calendario, pero sin
 * turnos.
 *
 * Los horarios completos SÍ se devuelven (con seatsLeft en 0) para poder mostrarlos
 * agotados, que informa más que esconderlos.
 */
export async function GET(request: Request) {
  const m = new URL(request.url).searchParams.get('m') ?? ''

  let ventana
  try {
    ventana = await getVentana()
  } catch (err) {
    console.error('[availability] ventana:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }

  const hoy = hoyBA()
  // El primer mes navegable es el del arranque de la ventana, que nunca es anterior a hoy.
  const minimo = ventana.desde.slice(0, 7)
  const pedido = /^\d{4}-(0[1-9]|1[0-2])$/.test(m) ? m : minimo

  // Ni meses ya pasados ni un futuro arbitrario. Si hay fecha de corte, manda ella:
  // no tiene sentido dejar navegar meses que ya se sabe que están vacíos.
  const limite = new Date(Date.UTC(Number(hoy.slice(0, 4)), Number(hoy.slice(5, 7)) - 1 + MESES_ADELANTE, 1))
  const tope = `${limite.getUTCFullYear()}-${String(limite.getUTCMonth() + 1).padStart(2, '0')}`
  const hasta = ventana.hasta && ventana.hasta.slice(0, 7) < tope ? ventana.hasta.slice(0, 7) : tope
  // Con una ventana que empieza después del tope, el máximo no puede quedar por debajo
  // del mínimo: si no, el clamp devolvería un mes anterior al que se pidió.
  const maximo = hasta < minimo ? minimo : hasta
  const mes = pedido < minimo ? minimo : pedido > maximo ? maximo : pedido

  const [year, month] = mes.split('-').map(Number)

  try {
    const dias = await getMonthAvailability(year, month)

    const publico: DiaPublico[] = dias.map((d) => ({
      date: d.date,
      slots: d.closed || !dentroDeVentana(d.date, ventana)
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

    return NextResponse.json({
      month: mes,
      today: hoy,
      // Con qué meses tiene sentido dejar navegar. El cliente apaga las flechas.
      minMonth: minimo,
      maxMonth: maximo,
      days: publico,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('[availability] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
}

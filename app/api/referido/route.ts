import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { referidoActivo } from '@/lib/booking/descuento'
import { COOKIE_REFERIDO } from '@/lib/booking/referidos'

export const dynamic = 'force-dynamic'

/**
 * GET /api/referido
 *
 * El descuento que tiene este visitante, en cada moneda. Es sólo para mostrarlo en el
 * checkout antes de reservar: el que se cobra lo vuelve a calcular `holdSeats`.
 */
export async function GET() {
  try {
    const ref = await referidoActivo((await cookies()).get(COOKIE_REFERIDO)?.value)
    return NextResponse.json({ usd: ref?.usd ?? 0, ars: ref?.ars ?? 0 })
  } catch (err) {
    // Sin base no hay descuento que mostrar, pero el checkout tiene que seguir andando.
    console.error('[referido] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ usd: 0, ars: 0 })
  }
}

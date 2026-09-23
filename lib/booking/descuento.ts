import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { referrals } from '@/lib/db/schema'
import { normalizarCodigo } from './referidos'

export type Referido = { code: string; usd: number; ars: number }

type Consulta = Pick<typeof db, 'select'>

/**
 * El referido activo que corresponde a un código, con sus porcentajes, o null.
 *
 * Es la única validación que cuenta: el código viene de una cookie que el navegador
 * puede editar, y el middleware la guarda sin mirar la base.
 */
export async function referidoActivo(
  valor: string | null | undefined,
  q: Consulta = db,
): Promise<Referido | null> {
  const code = normalizarCodigo(valor)
  if (!code) return null

  const [r] = await q
    .select({ code: referrals.code, usd: referrals.percentUsd, ars: referrals.percentArs })
    .from(referrals)
    .where(and(eq(referrals.code, code), eq(referrals.active, true)))
  return r ?? null
}

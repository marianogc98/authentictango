/**
 * Carga la semana por defecto: un tour a las 15:00 con 10 lugares, todos los días.
 *
 * Los precios quedan en 0 a propósito. La página pública no ofrece un horario sin precio,
 * así que nada queda reservable hasta que ella cargue los importes desde el panel: es
 * preferible que no se pueda reservar a que se pueda reservar gratis.
 *
 * Idempotente: se puede correr las veces que haga falta sin pisar lo ya configurado.
 */
import { Pool } from 'pg'

const url = process.env.DATABASE_URL?.trim()
if (!url) {
  console.error('[seed] Falta DATABASE_URL.')
  process.exit(1)
}

const pool = new Pool({ connectionString: url, max: 1 })

try {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM weekly_slots')
  if (rows[0].n > 0) {
    console.log(`[seed] weekly_slots ya tiene ${rows[0].n} filas. No se toca nada.`)
  } else {
    await pool.query(`
      INSERT INTO weekly_slots (weekday, "time", seats, price_usd, price_ars)
      SELECT d, '15:00:00'::time, 10, 0, 0 FROM generate_series(0, 6) AS d
    `)
    console.log('[seed] Semana por defecto cargada: 15:00, 10 lugares, precio sin definir.')
  }
} catch (err) {
  console.error('[seed] Error:', err instanceof Error ? err.message : err)
  process.exit(1)
} finally {
  await pool.end()
}

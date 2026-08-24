/**
 * Corre las migraciones pendientes contra DATABASE_URL.
 *
 * Se ejecuta en el arranque del contenedor, no en el build: la base sólo es alcanzable
 * desde dentro de la red de Docker, así que el build ni siquiera puede verla.
 *
 * Sale con código distinto de cero si falla, para que sirva suelto y en CI. Pero en el
 * arranque se encadena con ';' y no con '&&': el sitio es sobre todo marketing y no
 * necesita base, así que una migración fallida no puede tirar abajo la home. El problema
 * se ve en el log y en las páginas de reserva, que es donde corresponde.
 */
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

const url = process.env.DATABASE_URL?.trim()

if (!url) {
  console.error('[migrate] Falta DATABASE_URL. No hay nada que migrar.')
  process.exit(1)
}

const pool = new Pool({ connectionString: url, max: 1 })

try {
  await migrate(drizzle(pool), { migrationsFolder: './lib/db/migrations' })
  console.log('[migrate] Migraciones al día.')
} catch (err) {
  console.error('[migrate] Falló la migración:', err instanceof Error ? err.message : err)
  process.exit(1)
} finally {
  await pool.end()
}

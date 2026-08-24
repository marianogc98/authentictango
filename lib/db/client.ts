import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

/**
 * El pool se cachea en el global para que el hot reload de desarrollo no abra una
 * conexión nueva en cada recarga hasta agotar el límite de la base.
 *
 * `new Pool()` no conecta al construirse: falla recién en la primera consulta. Eso es
 * deliberado — si tirara acá, una DATABASE_URL faltante rompería el build entero y no
 * sólo las rutas que usan la base.
 */
const globalForDb = globalThis as unknown as { __pool?: Pool }

const pool =
  globalForDb.__pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  })

if (process.env.NODE_ENV !== 'production') globalForDb.__pool = pool

export const db = drizzle(pool, { schema })
export { pool }

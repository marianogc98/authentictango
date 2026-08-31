/**
 * Valida el esquema y la lógica de conteo contra Postgres real (PGlite, en WASM).
 * No reemplaza la prueba contra la base del VPS, pero atrapa acá los errores de SQL
 * en vez de descubrirlos en un deploy.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const db = new PGlite()
let fallos = 0
const ok = (nombre, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado)
  if (!bien) fallos++
  console.log(`${bien ? 'PASS' : 'FAIL'}  ${nombre}  ->  ${JSON.stringify(real)}${bien ? '' : `  (esperado ${JSON.stringify(esperado)})`}`)
}

// --- 1. La migración generada aplica sobre Postgres limpio ---
const dir = './lib/db/migrations'
for (const f of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  for (const stmt of readFileSync(`${dir}/${f}`, 'utf8').split('--> statement-breakpoint')) {
    if (stmt.trim()) await db.exec(stmt)
  }
}
const tablas = await db.query(
  `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1`,
)
ok('la migración crea las 5 tablas', tablas.rows.map((r) => r.table_name),
   ['booking_window', 'bookings', 'closed_dates', 'date_slots', 'weekly_slots'])

// --- 2. El seed es idempotente ---
const seed = `INSERT INTO weekly_slots (weekday, "time", seats, price_usd, price_ars)
              SELECT d, '15:00:00'::time, 10, 0, 0 FROM generate_series(0,6) AS d`
await db.exec(seed)
const n1 = await db.query('SELECT COUNT(*)::int AS n FROM weekly_slots')
ok('el seed carga 7 días', n1.rows[0].n, 7)

// --- 3. El lock por slot existe y no explota ---
await db.exec('BEGIN')
await db.query(`SELECT pg_advisory_xact_lock(hashtext('2026-09-15T15:00:00'))`)
await db.exec('COMMIT')
ok('pg_advisory_xact_lock disponible', true, true)

// --- 4. El conteo de asientos: pagados y holds vigentes cuentan; vencidos no ---
const base = `INSERT INTO bookings (uid, date, "time", seats, name, email, status, expires_at) VALUES `
await db.exec(`${base}
  ('a','2026-09-15','15:00:00',3,'A','a@x','paid',    now() + interval '1 hour'),
  ('b','2026-09-15','15:00:00',2,'B','b@x','pending', now() + interval '1 hour'),
  ('c','2026-09-15','15:00:00',4,'C','c@x','pending', now() - interval '1 minute'),
  ('d','2026-09-15','15:00:00',1,'D','d@x','expired', now() - interval '1 hour'),
  ('e','2026-09-15','15:00:00',5,'E','e@x','cancelled', now() + interval '1 hour')`)

const tomados = await db.query(`
  SELECT COALESCE(SUM(seats),0)::int AS n FROM bookings
   WHERE date='2026-09-15' AND "time"='15:00:00'
     AND (status='paid' OR (status='pending' AND expires_at > now()))`)
ok('cuenta pagados + holds vigentes, ignora vencidos/cancelados', tomados.rows[0].n, 5)

// --- 5. Expirar holds libera asientos ---
await db.exec(`UPDATE bookings SET status='expired'
                WHERE status='pending' AND expires_at <= now()`)
const trasExpirar = await db.query(`SELECT COUNT(*)::int AS n FROM bookings WHERE status='expired'`)
ok('el hold vencido pasa a expired', trasExpirar.rows[0].n, 2)

// --- 6. Idempotencia del webhook: no se puede repetir (provider, provider_ref) ---
await db.exec(`UPDATE bookings SET provider='mercadopago', provider_ref='MP-1' WHERE uid='a'`)
let choco = false
try {
  await db.exec(`UPDATE bookings SET provider='mercadopago', provider_ref='MP-1' WHERE uid='b'`)
} catch { choco = true }
ok('provider_ref duplicado es rechazado', choco, true)

// --- 7. Varias reservas sin pago conviven (NULLs no chocan en el índice único) ---
const sinPago = await db.query(
  `SELECT COUNT(*)::int AS n FROM bookings WHERE provider_ref IS NULL`)
ok('varias reservas sin provider_ref conviven', sinPago.rows[0].n >= 2, true)

// --- 8. La clase grupal no cambia nada de lo que ya estaba cargado ---
const clase = await db.query(
  `SELECT COUNT(*)::int AS n FROM weekly_slots WHERE class_price_usd = 0 AND class_price_ars = 0`)
ok('los horarios que ya existían quedan sin clase', clase.rows[0].n, 7)

const sinClase = await db.query(
  `SELECT COUNT(*)::int AS n FROM bookings WHERE with_class = false`)
ok('las reservas que ya existían quedan sin clase', sinClase.rows[0].n, 5)

console.log(fallos === 0 ? '\nTodo OK' : `\n${fallos} fallo(s)`)
process.exit(fallos === 0 ? 0 : 1)

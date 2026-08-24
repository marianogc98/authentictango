/**
 * El tour es siempre a la hora de Buenos Aires. Todo lo que decide "qué día es hoy" o
 * "ya pasó" tiene que resolverse en esa zona, nunca con la del visitante: un turista
 * reservando desde Tokio a las 2 AM está en otro día calendario que el tour.
 */
export const TZ = 'America/Argentina/Buenos_Aires'

function partes(d: Date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]))
  return p as Record<string, string>
}

/** "2026-09-01" en hora de Buenos Aires. */
export function hoyBA(d = new Date()): string {
  const p = partes(d)
  return `${p.year}-${p.month}-${p.day}`
}

/** "15:04:05" en hora de Buenos Aires. */
export function ahoraBA(d = new Date()): string {
  const p = partes(d)
  // Intl devuelve "24" para la medianoche con hour12:false; normalizamos a "00".
  const hora = p.hour === '24' ? '00' : p.hour
  return `${hora}:${p.minute}:${p.second}`
}

/** ¿El slot (fecha, hora) ya pasó según el reloj de Buenos Aires? */
export function yaPaso(date: string, time: string, d = new Date()): boolean {
  const hoy = hoyBA(d)
  if (date < hoy) return true
  if (date > hoy) return false
  return time <= ahoraBA(d)
}

/** Día de la semana (0 = domingo) de un "YYYY-MM-DD", sin que la zona local lo corra un día. */
export function weekdayDe(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/** Todas las fechas "YYYY-MM-DD" de un mes. */
export function fechasDelMes(year: number, month: number): string[] {
  const total = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const mm = String(month).padStart(2, '0')
  return Array.from({ length: total }, (_, i) => `${year}-${mm}-${String(i + 1).padStart(2, '0')}`)
}

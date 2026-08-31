import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { COOKIE, sesionValida } from '@/lib/admin/auth'
import { describirFiltro, parseFiltros, reservasParaCsv } from '@/lib/admin/reservas'
import { hhmm } from '@/lib/booking/dinero'
import { hoyBA, TZ } from '@/lib/booking/tiempo'

export const dynamic = 'force-dynamic'

/**
 * Separador punto y coma y decimales con coma: es lo que espera Excel configurado en
 * español, que es donde este archivo va a terminar. Con comas como separador, cada
 * importe se parte en dos columnas.
 */
const SEP = ';'

const CABECERA = [
  'uid', 'fecha_tour', 'hora', 'nombre', 'email', 'telefono', 'lugares', 'clase_grupal',
  'estado', 'metodo', 'importe', 'moneda', 'creada', 'pagada', 'ref_pasarela',
]

/**
 * Una celda lista para el archivo.
 *
 * Además de escapar comillas, neutraliza los valores que arrancan con =, +, - o @: una
 * planilla los interpreta como fórmula, y el nombre lo escribe un desconocido desde el
 * formulario público. Es la misma razón por la que no se confía en ningún otro input.
 */
function celda(valor: string | number | null | undefined): string {
  const s = String(valor ?? '')
  const seguro = /^[=+\-@]/.test(s) ? `'${s}` : s
  return `"${seguro.replace(/"/g, '""')}"`
}

/** Centavos a "45,50": con coma, para que la planilla lo lea como número. */
function importe(centavos: number | null): string {
  return centavos == null ? '' : (centavos / 100).toFixed(2).replace('.', ',')
}

function momento(d: Date | null): string {
  if (!d) return ''
  // "en-CA" da AAAA-MM-DD, que ordena bien como texto en cualquier planilla.
  return d.toLocaleString('en-CA', { timeZone: TZ, hour12: false })
}

/**
 * GET /admin/reservas/csv — baja lo que esté filtrado en pantalla.
 *
 * El layout de (panel) protege las páginas, pero no los route handlers: acá la sesión
 * se valida a mano. El middleware también cubre /admin, pero es una conveniencia que ya
 * falló una vez de forma silenciosa, así que no alcanza como única barrera.
 */
export async function GET(request: Request) {
  const store = await cookies()
  if (!(await sesionValida(store.get(COOKIE)?.value))) {
    return new NextResponse('No autorizado', { status: 401 })
  }

  const sp = Object.fromEntries(new URL(request.url).searchParams)
  const filtros = parseFiltros(sp)

  try {
    const filas = await reservasParaCsv(filtros)

    const lineas = [
      CABECERA.join(SEP),
      ...filas.map((r) => [
        r.uid, r.date, hhmm(r.time), r.name, r.email, r.phone ?? '', r.seats,
        r.withClass ? 'si' : 'no',
        r.estado, r.provider ?? '', importe(r.amount), r.currency ?? '',
        momento(r.createdAt), momento(r.paidAt), r.providerRef ?? '',
      ].map(celda).join(SEP)),
    ]

    // El BOM es lo que hace que Excel abra el archivo como UTF-8. Sin él, cada acento
    // del nombre de un pasajero llega roto.
    const cuerpo = `﻿${lineas.join('\r\n')}\r\n`
    const archivo = `reservas-${describirFiltro(filtros)}-${hoyBA()}.csv`

    return new NextResponse(cuerpo, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${archivo}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[reservas/csv] error:', err instanceof Error ? err.message : err)
    return new NextResponse('No se pudo generar el archivo', { status: 500 })
  }
}

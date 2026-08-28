import Link from 'next/link'
import { AlertTriangle, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import {
  aQuerystring, listarReservas, parseFiltros, POR_PAGINA, type Reserva,
} from '@/lib/admin/reservas'
import { formatearPrecio, hhmm } from '@/lib/booking/dinero'
import { AdminNav } from '../../nav'
import { BarraFiltros } from './filtros'

export const dynamic = 'force-dynamic'

const ESTADO: Record<string, { texto: string; clase: string }> = {
  paid: { texto: 'Pagada', clase: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  pending: { texto: 'Esperando pago', clase: 'bg-amber-500/15 text-amber-700 dark:text-amber-500' },
  overbooked: { texto: 'A reembolsar', clase: 'bg-red-500/15 text-red-700 dark:text-red-400' },
  cancelled: { texto: 'Cancelada', clase: 'bg-muted text-muted-foreground' },
  expired: { texto: 'Vencida', clase: 'bg-muted text-muted-foreground' },
}

const METODO: Record<string, string> = { paypal: 'PayPal', mercadopago: 'Mercado Pago' }

function fechaCorta(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  })
}

/** Los timestamps se guardan con zona: se muestran en la de Buenos Aires, como todo. */
function momento(d: Date | null) {
  if (!d) return '—'
  return d.toLocaleString('es-AR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filtros = parseFiltros(await searchParams)
  const { filas, totales, paginas, aReembolsar } = await listarReservas(filtros)

  const hayFiltro = Boolean(
    filtros.q || filtros.desde || filtros.hasta ||
    filtros.estado !== 'todas' || filtros.orden !== 'tour',
  )
  const qs = aQuerystring(filtros)
  const desde = (filtros.pagina - 1) * POR_PAGINA

  return (
    <>
      <AdminNav activo="reservas" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold">Reservas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Todo lo que se vendió, con quién compró y cuánto se cobró. El calendario
            muestra lo que viene; acá está el historial completo.
          </p>
        </div>

        {aReembolsar > 0 && filtros.estado !== 'overbooked' && (
          <Link href="/admin/reservas?estado=overbooked"
            className="flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm hover:bg-red-500/15">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>
              <strong>
                {aReembolsar} {aReembolsar === 1 ? 'pago cobrado' : 'pagos cobrados'} sin lugar.
              </strong>{' '}
              El pago se aprobó tarde y el lugar ya se había revendido: hay que devolver esa
              plata desde PayPal o Mercado Pago. Tocá acá para verlos.
            </span>
          </Link>
        )}

        <BarraFiltros inicial={filtros} hayFiltro={hayFiltro} />

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <Total etiqueta="Reservas" valor={String(totales.reservas)} />
            <Total etiqueta="Personas" valor={String(totales.personas)} />
            {/* USD y ARS nunca se suman: son precios independientes, sin conversión. */}
            <Total etiqueta="Cobrado USD" valor={formatearPrecio(totales.usd, 'USD')} />
            <Total etiqueta="Cobrado ARS" valor={formatearPrecio(totales.ars, 'ARS')} />
          </div>

          {totales.reservas > 0 && (
            <a href={`/admin/reservas/csv${qs ? `?${qs}` : ''}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4 hover:text-foreground">
              <Download className="h-4 w-4" /> Exportar CSV
            </a>
          )}
        </div>

        {filas.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {hayFiltro
              ? 'Ninguna reserva coincide con este filtro.'
              : 'Todavía no hay reservas.'}
          </p>
        ) : (
          <>
            {/* La tabla desborda antes que la página: el body nunca scrollea de costado. */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[52rem] text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <Th>Tour</Th>
                    <Th>Quién</Th>
                    <Th className="text-right">Lugares</Th>
                    <Th className="text-right">Importe</Th>
                    <Th>Método</Th>
                    <Th>Estado</Th>
                    <Th>Pagada</Th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((r) => <Fila key={r.uid} r={r} />)}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
              <span>
                {desde + 1}–{desde + filas.length} de {totales.reservas}
              </span>

              {paginas > 1 && (
                <div className="flex items-center gap-2">
                  <Paso
                    href={`/admin/reservas?${aQuerystring({ ...filtros, pagina: filtros.pagina - 1 })}`}
                    activo={filtros.pagina > 1} etiqueta="Anterior">
                    <ChevronLeft className="h-4 w-4" />
                  </Paso>
                  <span>Página {filtros.pagina} de {paginas}</span>
                  <Paso
                    href={`/admin/reservas?${aQuerystring({ ...filtros, pagina: filtros.pagina + 1 })}`}
                    activo={filtros.pagina < paginas} etiqueta="Siguiente">
                    <ChevronRight className="h-4 w-4" />
                  </Paso>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  )
}

function Fila({ r }: { r: Reserva }) {
  const estado = ESTADO[r.estado] ?? { texto: r.estado, clase: 'bg-muted text-muted-foreground' }

  return (
    <tr className="border-b border-border last:border-0 align-top">
      <Td>
        <span className="block font-medium capitalize">{fechaCorta(r.date)}</span>
        <span className="text-xs text-muted-foreground">{hhmm(r.time)}</span>
      </Td>

      <Td>
        <span className="block font-medium">{r.name}</span>
        <a href={`mailto:${r.email}`}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
          {r.email}
        </a>
        {r.phone && (
          <a href={`tel:${r.phone}`}
            className="ml-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
            {r.phone}
          </a>
        )}
      </Td>

      <Td className="text-right tabular-nums">{r.seats}</Td>

      <Td className="text-right tabular-nums">
        {r.amount != null && r.currency
          ? formatearPrecio(r.amount, r.currency as 'USD' | 'ARS')
          : '—'}
      </Td>

      <Td>
        {r.provider ? METODO[r.provider] ?? r.provider : '—'}
        {/* El id de la pasarela es con lo que se encuentra el pago para reembolsarlo. */}
        {r.providerRef && (
          <span className="mt-0.5 block max-w-[14rem] truncate font-mono text-[11px] text-muted-foreground"
            title={r.providerRef}>
            {r.providerRef}
          </span>
        )}
      </Td>

      <Td>
        <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${estado.clase}`}>
          {estado.texto}
        </span>
      </Td>

      <Td className="whitespace-nowrap text-xs text-muted-foreground">{momento(r.paidAt)}</Td>
    </tr>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2.5 font-medium ${className}`}>{children}</th>
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 ${className}`}>{children}</td>
}

function Total({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <span>
      <span className="text-muted-foreground">{etiqueta}: </span>
      <strong className="tabular-nums">{valor}</strong>
    </span>
  )
}

function Paso({
  href, activo, etiqueta, children,
}: {
  href: string; activo: boolean; etiqueta: string; children: React.ReactNode
}) {
  if (!activo) {
    return (
      <span aria-hidden className="rounded-md border border-border p-1.5 opacity-35">
        {children}
      </span>
    )
  }
  return (
    <Link href={href} aria-label={etiqueta}
      className="rounded-md border border-border p-1.5 hover:bg-accent">
      {children}
    </Link>
  )
}

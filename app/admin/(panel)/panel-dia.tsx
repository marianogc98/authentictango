'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { abrirDia, cerrarDia, detalleDia, guardarDia, volverALoNormal } from '@/lib/admin/dias'
import { aTexto, formatearPrecio, hhmm } from '@/lib/booking/dinero'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type Detalle = Awaited<ReturnType<typeof detalleDia>>
type SlotUI = {
  time: string; seats: number; priceUsd: string; priceArs: string
  classPriceUsd: string; classPriceArs: string
}

const NUEVO = (): SlotUI => ({
  time: '15:00', seats: 10, priceUsd: '0.00', priceArs: '0.00',
  classPriceUsd: '0.00', classPriceArs: '0.00',
})

const desdeDetalle = (d: Detalle): SlotUI[] =>
  d.slots.map((s) => ({
    time: hhmm(s.time),
    seats: s.seats,
    priceUsd: aTexto(s.priceUsd),
    priceArs: aTexto(s.priceArs),
    classPriceUsd: aTexto(s.classPriceUsd),
    classPriceArs: aTexto(s.classPriceArs),
  }))

function mensajeError(r: Record<string, unknown>): string {
  const hora = String(r.time ?? '').slice(0, 5)
  switch (r.error) {
    case 'con_reservas':
      return `Este día ya tiene ${r.pagados} lugar(es) vendido(s). No se puede cerrar sin cancelar esas reservas primero.`
    case 'horario_con_reservas':
      return `El horario de las ${hora} tiene ${r.vendidos} lugar(es) vendido(s): no se puede eliminar.`
    case 'menos_lugares_que_vendidos':
      return `Las ${hora} ya tienen ${r.vendidos} lugar(es) vendido(s). No se puede dejar menos que eso.`
    default:
      return 'No se pudo guardar el cambio.'
  }
}

/** Título chico de sección. Ordena el panel sin agregar peso visual. */
function Seccion({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  )
}

export function PanelDia({
  detalle,
  onCambio,
}: {
  detalle: Detalle
  onCambio: (d: Detalle) => void
}) {
  const [slots, setSlots] = useState<SlotUI[]>(() => desdeDetalle(detalle))
  const [error, setError] = useState<string | null>(null)
  const [pendiente, startTransition] = useTransition()

  const editar = (i: number, campo: keyof SlotUI, valor: string) =>
    setSlots((s) =>
      s.map((x, j) => (j === i ? { ...x, [campo]: campo === 'seats' ? Number(valor) : valor } : x)),
    )

  const correr = (fn: () => Promise<{ ok: boolean } & Record<string, unknown>>) =>
    startTransition(async () => {
      setError(null)
      const r = await fn()
      if (!r.ok) {
        setError(mensajeError(r))
        return
      }
      const fresco = await detalleDia(detalle.date)
      setSlots(desdeDetalle(fresco))
      onCambio(fresco)
    })

  const alternarDia = (trabaja: boolean) =>
    correr(() => (trabaja ? abrirDia(detalle.date) : cerrarDia(detalle.date)))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Cuerpo desplazable: el encabezado y las acciones quedan siempre a la vista. */}
      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-6">

        <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
          <span>
            <span className="block text-sm font-medium">Trabajo este día</span>
            <span className="block text-xs text-muted-foreground">
              {detalle.closed ? 'Cerrado: no aparece en la web' : 'Disponible para reservar'}
            </span>
          </span>
          <Switch checked={!detalle.closed} disabled={pendiente} onCheckedChange={alternarDia} />
        </label>

        {error && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            {error}
          </p>
        )}

        {!detalle.closed && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Seccion>Horarios</Seccion>
              {detalle.custom && (
                <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                  Distinto al habitual
                </span>
              )}
            </div>

            {slots.length === 0 && (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                Sin horarios. Agregá uno para poder recibir reservas este día.
              </p>
            )}

            {slots.map((s, i) => {
              const vendidos = detalle.slots.find((x) => hhmm(x.time) === s.time)?.vendidos ?? 0
              return (
                <div key={i} className="space-y-3 rounded-lg border border-border p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid flex-1 grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`hora-${i}`} className="text-xs text-muted-foreground">Hora</Label>
                        <Input id={`hora-${i}`} type="time" value={s.time}
                          onChange={(e) => editar(i, 'time', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`lugares-${i}`} className="text-xs text-muted-foreground">Lugares</Label>
                        <Input id={`lugares-${i}`} type="number" min={1} value={s.seats}
                          onChange={(e) => editar(i, 'seats', e.target.value)} />
                      </div>
                    </div>
                    <Button
                      type="button" variant="ghost" size="icon"
                      aria-label="Quitar horario"
                      className="mt-6 shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={vendidos > 0}
                      onClick={() => setSlots((v) => v.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`usd-${i}`} className="text-xs text-muted-foreground">Precio USD</Label>
                      <Input id={`usd-${i}`} inputMode="decimal" value={s.priceUsd}
                        onChange={(e) => editar(i, 'priceUsd', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`ars-${i}`} className="text-xs text-muted-foreground">Precio ARS</Label>
                      <Input id={`ars-${i}`} inputMode="decimal" value={s.priceArs}
                        onChange={(e) => editar(i, 'priceArs', e.target.value)} />
                    </div>
                  </div>

                  {/* Lo que se suma por persona si eligen el tour con clase grupal.
                      En cero, este horario se vende sin clase. */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`clase-usd-${i}`} className="text-xs text-muted-foreground">
                        + Clase USD
                      </Label>
                      <Input id={`clase-usd-${i}`} inputMode="decimal" value={s.classPriceUsd}
                        onChange={(e) => editar(i, 'classPriceUsd', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`clase-ars-${i}`} className="text-xs text-muted-foreground">
                        + Clase ARS
                      </Label>
                      <Input id={`clase-ars-${i}`} inputMode="decimal" value={s.classPriceArs}
                        onChange={(e) => editar(i, 'classPriceArs', e.target.value)} />
                    </div>
                  </div>

                  {vendidos > 0 && (
                    <p className="rounded bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
                      {vendidos} lugar(es) vendido(s): no se puede quitar este horario ni bajar de
                      ese número.
                    </p>
                  )}
                </div>
              )
            })}

            <Button type="button" variant="outline" size="sm" className="w-full"
              onClick={() => setSlots((v) => [...v, NUEVO()])}>
              <Plus className="mr-1.5 h-4 w-4" /> Agregar horario
            </Button>
          </section>
        )}

        <section className="space-y-3 border-t border-border pt-6">
          <Seccion>
            Reservas {detalle.reservas.length > 0 && `· ${detalle.reservas.length}`}
          </Seccion>

          {detalle.reservas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay reservas para este día.</p>
          ) : (
            <ul className="space-y-2">
              {detalle.reservas.map((r) => (
                <li key={r.uid} className="rounded-lg border border-border p-3.5 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium">{r.name}</span>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                        r.status === 'paid'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-500'
                      }`}
                    >
                      {r.status === 'paid' ? 'Pagado' : 'Esperando pago'}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {hhmm(r.time)} · {r.seats} lugar(es)
                    {r.withClass ? ' · con clase' : ''}
                    {r.amount != null && r.currency
                      ? ` · ${formatearPrecio(r.amount, r.currency as 'USD' | 'ARS')}`
                      : ''}
                  </p>

                  <p className="mt-1 flex flex-wrap gap-x-2 text-xs">
                    <a href={`mailto:${r.email}`} className="text-muted-foreground underline underline-offset-2 hover:text-foreground">
                      {r.email}
                    </a>
                    {r.phone && (
                      <a href={`tel:${r.phone}`} className="text-muted-foreground underline underline-offset-2 hover:text-foreground">
                        {r.phone}
                      </a>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Acciones fijas al pie: con la lista de reservas larga, quedaban fuera de vista. */}
      {!detalle.closed && (
        <div className="flex shrink-0 gap-2 border-t border-border bg-background px-6 py-4">
          <Button className="flex-1" disabled={pendiente}
            onClick={() => correr(() => guardarDia(detalle.date, slots))}>
            {pendiente ? 'Guardando…' : 'Guardar este día'}
          </Button>
          {detalle.custom && (
            <Button variant="outline" disabled={pendiente}
              onClick={() => correr(() => volverALoNormal(detalle.date))}>
              Volver a lo normal
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

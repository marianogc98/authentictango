'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { abrirDia, cerrarDia, detalleDia, guardarDia, volverALoNormal } from '@/lib/admin/dias'
import { aTexto, formatearPrecio, hhmm } from '@/lib/booking/dinero'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

type Detalle = Awaited<ReturnType<typeof detalleDia>>
type SlotUI = { time: string; seats: number; priceUsd: string; priceArs: string }

const NUEVO = (): SlotUI => ({ time: '15:00', seats: 10, priceUsd: '0.00', priceArs: '0.00' })

const desdeDetalle = (d: Detalle): SlotUI[] =>
  d.slots.map((s) => ({
    time: hhmm(s.time),
    seats: s.seats,
    priceUsd: aTexto(s.priceUsd),
    priceArs: aTexto(s.priceArs),
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

export function PanelDia({
  detalle,
  onCambio,
  onCerrar,
}: {
  detalle: Detalle
  onCambio: (d: Detalle) => void
  onCerrar: () => void
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
    <div className="space-y-6 py-4">
      <label className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
        <span className="font-medium">Trabajo este día</span>
        <Switch checked={!detalle.closed} disabled={pendiente} onCheckedChange={alternarDia} />
      </label>

      {error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {error}
        </p>
      )}

      {!detalle.closed && (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Horarios</h3>
              {detalle.custom && (
                <span className="text-xs text-blue-600 dark:text-blue-400">Distinto al habitual</span>
              )}
            </div>

            {slots.map((s, i) => {
              const vendidos = detalle.slots.find((x) => hhmm(x.time) === s.time)?.vendidos ?? 0
              return (
                <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                  <div className="grid grid-cols-[1fr_1fr_40px] gap-2">
                    <Input
                      type="time"
                      value={s.time}
                      onChange={(e) => editar(i, 'time', e.target.value)}
                    />
                    <Input
                      type="number"
                      min={1}
                      value={s.seats}
                      onChange={(e) => editar(i, 'seats', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Quitar horario"
                      disabled={vendidos > 0}
                      onClick={() => setSlots((v) => v.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      inputMode="decimal"
                      placeholder="Precio USD"
                      value={s.priceUsd}
                      onChange={(e) => editar(i, 'priceUsd', e.target.value)}
                    />
                    <Input
                      inputMode="decimal"
                      placeholder="Precio ARS"
                      value={s.priceArs}
                      onChange={(e) => editar(i, 'priceArs', e.target.value)}
                    />
                  </div>

                  {vendidos > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {vendidos} lugar(es) vendido(s): no se puede quitar este horario ni bajar de
                      ese número.
                    </p>
                  )}
                </div>
              )
            })}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSlots((v) => [...v, NUEVO()])}
            >
              <Plus className="mr-1 h-4 w-4" /> Agregar horario
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button disabled={pendiente} onClick={() => correr(() => guardarDia(detalle.date, slots))}>
              {pendiente ? 'Guardando…' : 'Guardar este día'}
            </Button>
            {detalle.custom && (
              <Button
                variant="outline"
                disabled={pendiente}
                onClick={() => correr(() => volverALoNormal(detalle.date))}
              >
                Volver a lo normal
              </Button>
            )}
          </div>
        </>
      )}

      <div className="space-y-3 border-t border-border pt-4">
        <h3 className="text-sm font-medium">
          Reservas {detalle.reservas.length > 0 && `(${detalle.reservas.length})`}
        </h3>

        {detalle.reservas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay reservas para este día.</p>
        ) : (
          <ul className="space-y-2">
            {detalle.reservas.map((r) => (
              <li key={r.uid} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{r.name}</span>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${
                      r.status === 'paid'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-500'
                    }`}
                  >
                    {r.status === 'paid' ? 'Pagado' : 'Esperando pago'}
                  </span>
                </div>

                <p className="mt-1 text-muted-foreground">
                  {hhmm(r.time)} · {r.seats} lugar(es)
                  {r.amount != null && r.currency
                    ? ` · ${formatearPrecio(r.amount, r.currency as 'USD' | 'ARS')}`
                    : ''}
                </p>

                <p className="text-muted-foreground">
                  <a href={`mailto:${r.email}`} className="underline">
                    {r.email}
                  </a>
                  {r.phone && (
                    <>
                      {' · '}
                      <a href={`tel:${r.phone}`} className="underline">
                        {r.phone}
                      </a>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button variant="ghost" className="w-full" onClick={onCerrar}>
        Cerrar
      </Button>
    </div>
  )
}

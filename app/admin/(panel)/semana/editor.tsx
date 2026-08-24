'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { guardarSemana } from '@/lib/admin/semana'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

export type SlotUI = { time: string; seats: number; priceUsd: string; priceArs: string }

// Se muestra arrancando en lunes, que es como se piensa una semana de trabajo.
// El número es el weekday que guarda la base (0 = domingo).
const DIAS: Array<[number, string]> = [
  [1, 'Lunes'], [2, 'Martes'], [3, 'Miércoles'], [4, 'Jueves'],
  [5, 'Viernes'], [6, 'Sábado'], [0, 'Domingo'],
]

const NUEVO = (): SlotUI => ({ time: '15:00', seats: 10, priceUsd: '0.00', priceArs: '0.00' })

export function EditorSemana({ inicial }: { inicial: Record<number, SlotUI[]> }) {
  const [semana, setSemana] = useState(inicial)
  const [guardando, startTransition] = useTransition()
  const [mensaje, setMensaje] = useState<string | null>(null)

  const editar = (dia: number, i: number, campo: keyof SlotUI, valor: string) =>
    setSemana((s) => ({
      ...s,
      [dia]: s[dia].map((slot, j) =>
        j === i ? { ...slot, [campo]: campo === 'seats' ? Number(valor) : valor } : slot,
      ),
    }))

  const agregar = (dia: number) => setSemana((s) => ({ ...s, [dia]: [...s[dia], NUEVO()] }))

  const quitar = (dia: number, i: number) =>
    setSemana((s) => ({ ...s, [dia]: s[dia].filter((_, j) => j !== i) }))

  // El switch no borra los horarios cargados: apagar un día y volver a prenderlo
  // no tiene por qué hacerle perder lo que ya había configurado.
  const alternar = (dia: number, activo: boolean) =>
    setSemana((s) => ({ ...s, [dia]: activo ? (s[dia].length ? s[dia] : [NUEVO()]) : [] }))

  const guardar = () =>
    startTransition(async () => {
      const r = await guardarSemana(semana)
      setMensaje(r.filas === 0
        ? 'Guardado. No quedó ningún horario: por ahora no se puede reservar ningún día.'
        : `Guardado: ${r.filas} horario${r.filas === 1 ? '' : 's'} en la semana.`)
    })

  const sinPrecio = Object.values(semana).flat()
    .some((s) => Number(s.priceUsd) === 0 && Number(s.priceArs) === 0)

  return (
    <div className="space-y-4">
      {DIAS.map(([dia, nombre]) => {
        const slots = semana[dia] ?? []
        const activo = slots.length > 0

        return (
          <div key={dia} className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3">
                <Switch checked={activo} onCheckedChange={(v) => alternar(dia, v)} />
                <span className="font-medium">{nombre}</span>
              </label>
              {!activo && <span className="text-sm text-muted-foreground">No trabajo</span>}
            </div>

            {activo && (
              <div className="mt-4 space-y-3">
                <div className="hidden gap-3 px-1 text-xs text-muted-foreground sm:grid sm:grid-cols-[100px_90px_1fr_1fr_40px]">
                  <span>Horario</span><span>Lugares</span><span>Precio USD</span><span>Precio ARS</span><span />
                </div>

                {slots.map((slot, i) => (
                  <div key={i} className="grid grid-cols-2 gap-3 sm:grid-cols-[100px_90px_1fr_1fr_40px]">
                    <Input type="time" value={slot.time}
                      onChange={(e) => editar(dia, i, 'time', e.target.value)} />
                    <Input type="number" min={1} max={200} value={slot.seats}
                      onChange={(e) => editar(dia, i, 'seats', e.target.value)} />
                    <Input inputMode="decimal" placeholder="USD" value={slot.priceUsd}
                      onChange={(e) => editar(dia, i, 'priceUsd', e.target.value)} />
                    <Input inputMode="decimal" placeholder="ARS" value={slot.priceArs}
                      onChange={(e) => editar(dia, i, 'priceArs', e.target.value)} />
                    <Button type="button" variant="ghost" size="icon" aria-label="Quitar horario"
                      onClick={() => quitar(dia, i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button type="button" variant="outline" size="sm" onClick={() => agregar(dia)}>
                  <Plus className="mr-1 h-4 w-4" /> Agregar horario
                </Button>
              </div>
            )}
          </div>
        )
      })}

      {sinPrecio && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          Hay horarios sin precio. Mientras estén en cero no se van a poder reservar desde
          la web: es preferible que no se pueda reservar a que se reserve gratis.
        </p>
      )}

      <div className="flex items-center gap-4 pt-2">
        <Button onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar semana'}
        </Button>
        {mensaje && <span className="text-sm text-muted-foreground">{mensaje}</span>}
      </div>
    </div>
  )
}

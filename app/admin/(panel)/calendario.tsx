'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { DiaDisponible } from '@/lib/booking/availability'
import { detalleDia } from '@/lib/admin/dias'
import { dentroDeVentana, type Ventana } from '@/lib/booking/tipos'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { PanelDia } from './panel-dia'

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
               'septiembre','octubre','noviembre','diciembre']
const CABECERAS = ['L','M','M','J','V','S','D']

type Detalle = Awaited<ReturnType<typeof detalleDia>>

/** Estado visual de un día. El orden importa: se evalúa de arriba hacia abajo. */
function estado(d: DiaDisponible) {
  if (d.closed) return { clase: 'bg-muted text-muted-foreground', nota: 'Cerrado' }
  if (d.slots.length === 0) return { clase: 'bg-muted/50 text-muted-foreground', nota: '—' }

  const lugares = d.slots.reduce((n, s) => n + s.seatsLeft, 0)
  const tomados = d.slots.reduce((n, s) => n + s.seatsTaken, 0)

  if (lugares === 0) return { clase: 'bg-red-500/15 text-red-700 dark:text-red-400', nota: 'Completo' }
  if (tomados > 0) return { clase: 'bg-amber-500/15 text-amber-700 dark:text-amber-500', nota: `${tomados} reservado${tomados === 1 ? '' : 's'}` }
  return { clase: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', nota: `${lugares} libres` }
}

function mesVecino(year: number, month: number, delta: number) {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function Calendario({
  year, month, dias, hoy, ventana,
}: {
  year: number; month: number; dias: DiaDisponible[]; hoy: string; ventana: Ventana
}) {
  const [abierto, setAbierto] = useState<Detalle | null>(null)
  const [cargando, startTransition] = useTransition()

  // getUTCDay() da 0=domingo; la grilla arranca en lunes, así que se corre uno.
  const primerDia = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const huecos = (primerDia + 6) % 7

  const abrir = (date: string) =>
    startTransition(async () => setAbierto(await detalleDia(date)))

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold capitalize">{MESES[month - 1]} {year}</h1>
        <div className="flex gap-1">
          <Link href={`/admin?m=${mesVecino(year, month, -1)}`}
            className="rounded-md border border-border p-2 hover:bg-accent" aria-label="Mes anterior">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link href={`/admin?m=${mesVecino(year, month, 1)}`}
            className="rounded-md border border-border p-2 hover:bg-accent" aria-label="Mes siguiente">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {CABECERAS.map((c, i) => (
          <div key={i} className="pb-1 text-center text-xs font-medium text-muted-foreground">{c}</div>
        ))}

        {Array.from({ length: huecos }, (_, i) => <div key={`h${i}`} />)}

        {dias.map((d) => {
          const { clase, nota } = estado(d)
          const dia = Number(d.date.slice(-2))
          const esHoy = d.date === hoy
          const pasado = d.date < hoy
          // Un día fuera del período no se ofrece en la web, aunque acá tenga horarios.
          const afuera = !pasado && !dentroDeVentana(d.date, ventana)

          return (
            <button
              key={d.date}
              onClick={() => abrir(d.date)}
              disabled={cargando}
              title={afuera ? 'Fuera del período de reservas' : undefined}
              className={`flex min-h-[68px] flex-col items-start rounded-md border p-1.5 text-left transition-colors sm:p-2
                ${clase}
                ${esHoy ? 'border-foreground' : afuera ? 'border-dashed border-border' : 'border-transparent'}
                ${d.custom ? 'ring-1 ring-blue-500/60' : ''}
                ${pasado || afuera ? 'opacity-45' : 'hover:brightness-95'}`}
            >
              <span className="text-sm font-semibold">{dia}</span>
              <span className="mt-auto text-[10px] leading-tight sm:text-xs">
                {afuera ? 'Sin reservas' : nota}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <Leyenda clase="bg-emerald-500/30">Con lugar</Leyenda>
        <Leyenda clase="bg-amber-500/30">Con reservas</Leyenda>
        <Leyenda clase="bg-red-500/30">Completo</Leyenda>
        <Leyenda clase="bg-muted">No trabaja</Leyenda>
        <Leyenda clase="ring-1 ring-blue-500/60">Horario distinto al habitual</Leyenda>
        <Leyenda clase="border border-dashed border-border">Fuera del período</Leyenda>
      </div>

      <Sheet open={abierto !== null} onOpenChange={(v) => !v && setAbierto(null)}>
        {/* Sin padding ni scroll propios: los maneja PanelDia, para que el encabezado
            quede fijo y sólo se desplace el contenido. El pr-14 deja libre la X. */}
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="shrink-0 space-y-1 border-b border-border px-6 py-5 pr-14">
            <SheetTitle className="text-base capitalize">
              {abierto && fechaLarga(abierto.date)}
            </SheetTitle>
            <SheetDescription>{abierto && resumenDia(abierto)}</SheetDescription>
          </SheetHeader>
          {abierto && <PanelDia detalle={abierto} onCambio={setAbierto} />}
        </SheetContent>
      </Sheet>
    </>
  )
}

function fechaLarga(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

/** Una línea con el estado del día, para no tener que leer todo el panel para saberlo. */
function resumenDia(d: Detalle): string {
  if (d.closed) return 'No trabajás este día'
  if (d.slots.length === 0) return 'Sin horarios cargados'

  const capacidad = d.slots.reduce((n, s) => n + s.seats, 0)
  const vendidos = d.slots.reduce((n, s) => n + s.vendidos, 0)
  const horarios = `${d.slots.length} horario${d.slots.length === 1 ? '' : 's'}`

  return `${horarios} · ${vendidos} de ${capacidad} lugares vendidos`
}

function Leyenda({ clase, children }: { clase: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${clase}`} />
      {children}
    </span>
  )
}

'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import type { Filtros } from '@/lib/admin/reservas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Un <select> nativo y no el de Radix: dentro de un form GET, el de Radix necesita un
// input escondido en paralelo, y no gana nada a cambio.
const SELECT =
  'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30'

const ESTADOS: Array<[Filtros['estado'], string]> = [
  ['todas', 'Todas (sin vencidas)'],
  ['paid', 'Pagadas'],
  ['pending', 'Esperando pago'],
  ['overbooked', 'A reembolsar'],
  ['cancelled', 'Canceladas'],
  ['expired', 'Vencidas'],
]

/**
 * La barra de filtros es un form GET: los filtros viven en la URL, así que el botón de
 * atrás funciona y el link se puede guardar o mandar. Lo único que necesita JavaScript
 * es que cambiar un desplegable dispare la búsqueda sin tener que apretar el botón.
 */
export function BarraFiltros({ inicial, hayFiltro }: { inicial: Filtros; hayFiltro: boolean }) {
  const form = useRef<HTMLFormElement>(null)
  const enviar = () => form.current?.requestSubmit()

  return (
    <form ref={form} action="/admin/reservas" method="get"
      className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto] lg:items-end">

      <Campo htmlFor="q" label="Buscar">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="q" name="q" defaultValue={inicial.q} className="pl-8"
            placeholder="Nombre, mail, teléfono o uid" />
        </div>
      </Campo>

      <Campo htmlFor="estado" label="Estado">
        <select id="estado" name="estado" defaultValue={inicial.estado}
          className={SELECT} onChange={enviar}>
          {ESTADOS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
      </Campo>

      <Campo htmlFor="orden" label="Fecha">
        <select id="orden" name="orden" defaultValue={inicial.orden}
          className={SELECT} onChange={enviar}>
          <option value="tour">Del tour</option>
          <option value="pago">De pago</option>
        </select>
      </Campo>

      <Campo htmlFor="desde" label="Desde">
        <Input id="desde" name="desde" type="date" defaultValue={inicial.desde ?? ''} />
      </Campo>

      <Campo htmlFor="hasta" label="Hasta">
        <Input id="hasta" name="hasta" type="date" defaultValue={inicial.hasta ?? ''} />
      </Campo>

      <div className="flex gap-2">
        <Button type="submit">Filtrar</Button>
        {hayFiltro && (
          <Button asChild variant="ghost">
            <Link href="/admin/reservas">Limpiar</Link>
          </Button>
        )}
      </div>
    </form>
  )
}

function Campo({
  htmlFor, label, children,
}: {
  htmlFor: string; label: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

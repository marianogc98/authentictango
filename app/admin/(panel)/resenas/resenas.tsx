'use client'

import { useState, useTransition } from 'react'
import {
  borrarResena, crearResena, guardarResena,
  type DatosResena, type FilaResena, type ResultadoResena,
} from '@/lib/admin/resenas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { CODIGOS_PAIS, nombrePais } from '@/lib/paises'

const ERRORES: Record<string, string> = {
  sin_sesion: 'La sesión venció. Volvé a entrar al panel.',
  sin_nombre: 'Falta el nombre.',
  pais_invalido: 'Elegí el país de la lista.',
  estrellas_invalidas: 'Las estrellas van de 1 a 5.',
  mes_invalido: 'Elegí el mes de la reseña.',
  sin_texto: 'Hace falta el texto en los dos idiomas.',
}

const mensajeDe = (r: ResultadoResena) => (r.ok ? null : ERRORES[r.error] ?? 'No se pudo guardar.')

/** El mes actual en formato "2026-10", para arrancar una reseña nueva. */
const mesActual = () => new Date().toISOString().slice(0, 7)

const vacia = (): DatosResena => ({
  name: '', country: '', rating: 5, mes: mesActual(), textEs: '', textEn: '', visible: true,
})

/** Los países por su nombre en español, que es como ella los busca en la lista. */
const PAISES = CODIGOS_PAIS
  .map((codigo) => ({ codigo, nombre: nombrePais(codigo, 'es') }))
  .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

export function NuevaResena() {
  const [abierta, setAbierta] = useState(false)
  const [datos, setDatos] = useState<DatosResena>(vacia)
  const [guardando, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!abierta) {
    return <Button onClick={() => setAbierta(true)}>Nueva reseña</Button>
  }

  const crear = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      setError(null)
      const r = await crearResena(datos)
      if (!r.ok) return setError(mensajeDe(r))
      setDatos(vacia())
      setAbierta(false)
    })
  }

  return (
    <form onSubmit={crear} className="rounded-lg border border-border p-4">
      <h2 className="font-medium">Nueva reseña</h2>
      <Campos id="nueva" datos={datos} onChange={(d) => { setDatos(d); setError(null) }} />
      {error && <Aviso texto={error} />}
      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={guardando}>{guardando ? 'Creando…' : 'Crear'}</Button>
        <Button type="button" variant="ghost" onClick={() => setAbierta(false)} disabled={guardando}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

export function ListaResenas({ filas }: { filas: FilaResena[] }) {
  if (filas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Todavía no hay reseñas.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* La key incluye los datos: si el servidor devuelve otra versión, el formulario
          arranca de nuevo desde ella en vez de quedarse con lo que tenía tipeado. */}
      {filas.map((f) => <Resena key={`${f.id}:${JSON.stringify(f)}`} fila={f} />)}
    </div>
  )
}

function Resena({ fila }: { fila: FilaResena }) {
  const { id, ...original } = fila
  const [datos, setDatos] = useState<DatosResena>(original)
  const [guardando, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const cambio = JSON.stringify(datos) !== JSON.stringify(original)

  const guardar = () =>
    startTransition(async () => {
      setError(null)
      setError(mensajeDe(await guardarResena(id, datos)))
    })

  const borrar = () => {
    if (!confirm(`¿Borrar la reseña de ${original.name}? No se puede deshacer.`)) return
    startTransition(async () => {
      setError(null)
      setError(mensajeDe(await borrarResena(id)))
    })
  }

  return (
    <div className={`rounded-lg border border-border p-4 ${original.visible ? '' : 'bg-muted/40'}`}>
      <Campos id={`r${id}`} datos={datos} onChange={(d) => { setDatos(d); setError(null) }} />
      {error && <Aviso texto={error} />}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={guardar} disabled={guardando || !cambio}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </Button>
        {cambio && (
          <Button size="sm" variant="ghost" onClick={() => setDatos(original)} disabled={guardando}>
            Descartar cambios
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={borrar} disabled={guardando} className="ml-auto text-destructive">
          Borrar
        </Button>
      </div>
    </div>
  )
}

function Campos({ id, datos, onChange }: {
  id: string; datos: DatosResena; onChange: (d: DatosResena) => void
}) {
  const set = <K extends keyof DatosResena>(k: K, v: DatosResena[K]) => onChange({ ...datos, [k]: v })

  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_auto_auto_auto] lg:items-end">
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-nombre`} className="text-xs text-muted-foreground">Nombre</Label>
          <Input id={`${id}-nombre`} value={datos.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-pais`} className="text-xs text-muted-foreground">País</Label>
          <select
            id={`${id}-pais`}
            value={datos.country}
            onChange={(e) => set('country', e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">Sin país</option>
            {/* Los nombres los pone Intl, y el servidor y el navegador pueden traer versiones
                apenas distintas de los datos de idioma: no es un error que valga avisar. */}
            {PAISES.map((p) => (
              <option key={p.codigo} value={p.codigo} suppressHydrationWarning>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-estrellas`} className="text-xs text-muted-foreground">Estrellas</Label>
          <select
            id={`${id}-estrellas`}
            value={datos.rating}
            onChange={(e) => set('rating', Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-mes`} className="text-xs text-muted-foreground">Mes</Label>
          <Input id={`${id}-mes`} type="month" value={datos.mes} onChange={(e) => set('mes', e.target.value)} />
        </div>
        <label className="flex h-9 items-center gap-2 text-sm">
          <Switch checked={datos.visible} onCheckedChange={(v) => set('visible', v)} />
          {datos.visible ? 'Visible' : 'Oculta'}
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-es`} className="text-xs text-muted-foreground">Texto en español</Label>
          <Textarea id={`${id}-es`} rows={5} value={datos.textEs} onChange={(e) => set('textEs', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-en`} className="text-xs text-muted-foreground">Texto en inglés</Label>
          <Textarea id={`${id}-en`} rows={5} value={datos.textEn} onChange={(e) => set('textEn', e.target.value)} />
        </div>
      </div>
    </div>
  )
}

function Aviso({ texto }: { texto: string }) {
  return (
    <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
      {texto}
    </p>
  )
}

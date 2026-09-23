'use client'

import { useState, useTransition } from 'react'
import { Check, Copy } from 'lucide-react'
import {
  borrarReferido, crearReferido, guardarReferido,
  type FilaReferido, type ResultadoReferido,
} from '@/lib/admin/referidos'
import { formatearPrecio } from '@/lib/booking/dinero'
import { PORCENTAJE_MAXIMO, normalizarCodigo } from '@/lib/booking/referidos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const ERRORES: Record<string, string> = {
  sin_sesion: 'La sesión venció. Volvé a entrar al panel.',
  codigo_invalido: 'El código sólo puede tener letras sin acentos, números, puntos, guiones y guiones bajos (de 2 a 40).',
  porcentaje_invalido: `El porcentaje tiene que ser un número entero entre 0 y ${PORCENTAJE_MAXIMO}.`,
  ya_existe: 'Ya hay un referido con ese código.',
  tiene_reservas: 'Ya trajo reservas, así que no se puede borrar. Desactivalo: deja de dar descuento y las reservas siguen sabiendo de quién son.',
}

const mensajeDe = (r: ResultadoReferido) => (r.ok ? null : ERRORES[r.error] ?? 'No se pudo guardar.')

const linkDe = (sitio: string, code: string) => `${sitio}/?utm_source=${code}`

/** "" del input es 0: dejar un campo vacío es no dar descuento en esa moneda. */
const aNumero = (v: string) => (v.trim() === '' ? 0 : Number(v))

export function NuevoReferido({ sitio }: { sitio: string }) {
  const [codigo, setCodigo] = useState('')
  const [usd, setUsd] = useState('')
  const [ars, setArs] = useState('')
  const [guardando, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const normalizado = normalizarCodigo(codigo)

  const crear = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      setError(null)
      const r = await crearReferido(codigo, aNumero(usd), aNumero(ars))
      if (!r.ok) return setError(mensajeDe(r))
      setCodigo(''); setUsd(''); setArs('')
    })
  }

  return (
    <form onSubmit={crear} className="rounded-lg border border-border p-4">
      <h2 className="font-medium">Nuevo referido</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="codigo" className="text-xs text-muted-foreground">Código</Label>
          <Input id="codigo" placeholder="tomas.sosa" value={codigo} autoComplete="off"
            onChange={(e) => { setCodigo(e.target.value); setError(null) }} />
        </div>
        <CampoPorcentaje id="usd" etiqueta="% en USD" valor={usd} onChange={setUsd} />
        <CampoPorcentaje id="ars" etiqueta="% en ARS" valor={ars} onChange={setArs} />
        <Button type="submit" disabled={guardando || !normalizado}>
          {guardando ? 'Creando…' : 'Crear'}
        </Button>
      </div>

      {normalizado && (
        <p className="mt-3 break-all text-sm text-muted-foreground">
          El link va a ser <span className="font-mono text-foreground">{linkDe(sitio, normalizado)}</span>
        </p>
      )}
      {error && <Aviso texto={error} />}
    </form>
  )
}

export function TablaReferidos({ filas, sitio }: { filas: FilaReferido[]; sitio: string }) {
  if (filas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Todavía no hay referidos.
      </p>
    )
  }

  return (
    // La tabla desborda antes que la página: el body nunca scrollea de costado.
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[52rem] text-sm">
        <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Código</th>
            <th className="px-3 py-2 font-medium">% USD</th>
            <th className="px-3 py-2 font-medium">% ARS</th>
            <th className="px-3 py-2 font-medium">Activo</th>
            <th className="px-3 py-2 text-right font-medium">Vendió</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => <Fila key={f.code} f={f} sitio={sitio} />)}
        </tbody>
      </table>
    </div>
  )
}

function Fila({ f, sitio }: { f: FilaReferido; sitio: string }) {
  const [usd, setUsd] = useState(String(f.percentUsd))
  const [ars, setArs] = useState(String(f.percentArs))
  const [activo, setActivo] = useState(f.active)
  const [guardando, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  const cambio = aNumero(usd) !== f.percentUsd || aNumero(ars) !== f.percentArs || activo !== f.active

  const guardar = () =>
    startTransition(async () => {
      setError(null)
      setError(mensajeDe(await guardarReferido(f.code, {
        percentUsd: aNumero(usd), percentArs: aNumero(ars), active: activo,
      })))
    })

  const borrar = () => {
    if (!confirm(`¿Borrar el referido ${f.code}?`)) return
    startTransition(async () => {
      setError(null)
      setError(mensajeDe(await borrarReferido(f.code)))
    })
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(linkDe(sitio, f.code))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      setError('No se pudo copiar. El link es ' + linkDe(sitio, f.code))
    }
  }

  return (
    <>
      <tr className={`border-b border-border last:border-0 ${f.active ? '' : 'text-muted-foreground'}`}>
        <td className="px-3 py-2">
          <span className="font-mono">{f.code}</span>
          <button type="button" onClick={copiar}
            className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
            {copiado ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copiado ? 'Copiado' : 'Copiar link'}
          </button>
        </td>
        <td className="px-3 py-2">
          <Input aria-label="% en USD" type="number" min={0} max={PORCENTAJE_MAXIMO} step={1}
            className="h-8 w-20" value={usd} onChange={(e) => setUsd(e.target.value)} />
        </td>
        <td className="px-3 py-2">
          <Input aria-label="% en ARS" type="number" min={0} max={PORCENTAJE_MAXIMO} step={1}
            className="h-8 w-20" value={ars} onChange={(e) => setArs(e.target.value)} />
        </td>
        <td className="px-3 py-2">
          <Switch aria-label="Activo" checked={activo} onCheckedChange={setActivo} />
        </td>
        <td className="px-3 py-2 text-right tabular-nums">
          <span className="block">{f.pagas} {f.pagas === 1 ? 'reserva paga' : 'reservas pagas'}</span>
          {/* USD y ARS nunca se suman: son precios independientes, sin conversión. */}
          {f.usd > 0 && <span className="block text-xs text-muted-foreground">{formatearPrecio(f.usd, 'USD')}</span>}
          {f.ars > 0 && <span className="block text-xs text-muted-foreground">{formatearPrecio(f.ars, 'ARS')}</span>}
        </td>
        <td className="px-3 py-2 text-right whitespace-nowrap">
          <Button size="sm" onClick={guardar} disabled={guardando || !cambio}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </Button>
          {f.pagas === 0 && (
            <Button size="sm" variant="ghost" onClick={borrar} disabled={guardando} className="ml-1">
              Borrar
            </Button>
          )}
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={6} className="px-3 pb-3"><Aviso texto={error} /></td>
        </tr>
      )}
    </>
  )
}

function CampoPorcentaje({ id, etiqueta, valor, onChange }: {
  id: string; etiqueta: string; valor: string; onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{etiqueta}</Label>
      <Input id={id} type="number" min={0} max={PORCENTAJE_MAXIMO} step={1} placeholder="0"
        value={valor} onChange={(e) => onChange(e.target.value)} />
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

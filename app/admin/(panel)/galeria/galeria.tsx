'use client'

import { useRef, useState, useTransition, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, Play } from 'lucide-react'
import {
  agregarVideo, borrarImagen, guardarImagen, moverImagen, subirImagen,
  type FilaImagen, type ResultadoImagen,
} from '@/lib/admin/galeria'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ERRORES: Record<string, string> = {
  sin_sesion: 'La sesión venció. Volvé a entrar al panel.',
  sin_volumen: 'Falta configurar dónde se guardan las fotos (MEDIA_DIR).',
  archivo_invalido: 'Ese archivo no es una foto que se pueda usar.',
  muy_grande: 'La foto es demasiado pesada.',
  link_invalido: 'Ese link no es de un video de YouTube.',
}

const mensajeDe = (r: ResultadoImagen) => (r.ok ? null : ERRORES[r.error] ?? 'No se pudo guardar.')

/** Lado mayor de la foto ya achicada: alcanza para verla a pantalla completa. */
const LADO_MAXIMO = 2000

/**
 * Achica la foto en el navegador y la pasa a JPG antes de mandarla. Una foto de celular
 * pesa varios megas; achicada pesa unos cientos de KB, sube rápido y entra en el límite
 * del servidor. De paso se van los datos EXIF, que pueden incluir dónde se sacó.
 */
async function achicar(archivo: File): Promise<Blob> {
  const imagen = await createImageBitmap(archivo)
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(imagen.width * escala)
  canvas.height = Math.round(imagen.height * escala)
  canvas.getContext('2d')!.drawImage(imagen, 0, 0, canvas.width, canvas.height)
  imagen.close()
  return new Promise((ok, mal) =>
    canvas.toBlob((b) => (b ? ok(b) : mal(new Error('sin blob'))), 'image/jpeg', 0.85),
  )
}

export function SubirImagenes() {
  const input = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState<string | null>(null)
  const [errores, setErrores] = useState<string[]>([])
  const [subiendo, startTransition] = useTransition()

  const subir = (archivos: File[]) =>
    startTransition(async () => {
      const fallas: string[] = []
      for (const [i, archivo] of archivos.entries()) {
        setEstado(`Subiendo ${i + 1} de ${archivos.length}…`)
        let blob: Blob
        try {
          blob = await achicar(archivo)
        } catch {
          fallas.push(`${archivo.name}: no se pudo leer. Probá con una foto JPG o PNG.`)
          continue
        }
        const form = new FormData()
        form.set('archivo', blob, 'foto.jpg')
        const r = await subirImagen(form).catch(() => null)
        const error = r ? mensajeDe(r) : 'No se pudo conectar con el servidor.'
        if (error) fallas.push(`${archivo.name}: ${error}`)
      }
      setEstado(null)
      setErrores(fallas)
      if (input.current) input.current.value = ''
    })

  return (
    <div className="rounded-lg border border-border p-4">
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const archivos = Array.from(e.target.files ?? [])
          if (archivos.length) subir(archivos)
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => input.current?.click()} disabled={subiendo}>
          {subiendo ? estado ?? 'Subiendo…' : 'Subir fotos'}
        </Button>
        <span className="text-sm text-muted-foreground">Se agregan al final. Podés elegir varias a la vez.</span>
      </div>
      {errores.map((e) => <Aviso key={e} texto={e} />)}
    </div>
  )
}

/** Un video de YouTube entra a la galería pegando su link: no se sube, se embebe. */
export function AgregarVideo() {
  const [link, setLink] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [agregando, startTransition] = useTransition()

  const agregar = (e: FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const r = await agregarVideo(link, '', '').catch(() => null)
      const fallo = r ? mensajeDe(r) : 'No se pudo conectar con el servidor.'
      setError(fallo)
      if (!fallo) setLink('')
    })
  }

  return (
    <form onSubmit={agregar} className="rounded-lg border border-border p-4">
      <Label htmlFor="video-link" className="text-sm">Agregar un video de YouTube</Label>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Input
          id="video-link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
          className="min-w-0 flex-1 basis-64"
        />
        <Button type="submit" disabled={agregando || !link.trim()}>
          {agregando ? 'Agregando…' : 'Agregar video'}
        </Button>
      </div>
      {error && <Aviso texto={error} />}
    </form>
  )
}

export function ListaImagenes({ filas }: { filas: FilaImagen[] }) {
  if (filas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No hay fotos. Mientras tanto, la galería no se muestra en la web.
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filas.map((f, i) => (
        <Imagen
          key={`${f.id}:${f.altEs}:${f.altEn}`}
          fila={f}
          posicion={i + 1}
          primera={i === 0}
          ultima={i === filas.length - 1}
        />
      ))}
    </div>
  )
}

function Imagen({ fila, posicion, primera, ultima }: {
  fila: FilaImagen; posicion: number; primera: boolean; ultima: boolean
}) {
  const [altEs, setAltEs] = useState(fila.altEs)
  const [altEn, setAltEn] = useState(fila.altEn)
  const [ocupado, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const cambio = altEs !== fila.altEs || altEn !== fila.altEn

  const correr = (accion: () => Promise<ResultadoImagen>) =>
    startTransition(async () => {
      setError(null)
      setError(mensajeDe(await accion()))
    })

  const borrar = () => {
    if (!confirm(`¿Sacar ${fila.youtubeId ? 'este video' : 'esta foto'} de la galería? No se puede deshacer.`)) return
    correr(() => borrarImagen(fila.id))
  }

  return (
    <div className={`overflow-hidden rounded-lg border border-border ${ocupado ? 'opacity-60' : ''}`}>
      <div className="relative aspect-[4/3] bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- miniatura del panel, no hace falta optimizarla */}
        <img src={fila.src} alt={fila.altEs} className="absolute inset-0 h-full w-full object-cover" />
        <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
          {posicion}{primera ? ' · grande' : ''}{fila.youtubeId ? ' · video' : ''}
        </span>
        {fila.youtubeId && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white">
              <Play className="h-5 w-5 translate-x-0.5" fill="currentColor" />
            </span>
          </span>
        )}
      </div>
      <div className="space-y-3 p-3">
        <div className="space-y-1.5">
          <Label htmlFor={`img${fila.id}-es`} className="text-xs text-muted-foreground">Descripción en español</Label>
          <Input id={`img${fila.id}-es`} value={altEs} onChange={(e) => setAltEs(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`img${fila.id}-en`} className="text-xs text-muted-foreground">Descripción en inglés</Label>
          <Input id={`img${fila.id}-en`} value={altEn} onChange={(e) => setAltEn(e.target.value)} />
        </div>
        {error && <Aviso texto={error} />}
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" aria-label="Mover antes" disabled={ocupado || primera}
            onClick={() => correr(() => moverImagen(fila.id, 'antes'))}>
            <ArrowUp className="h-4 w-4 sm:-rotate-90" />
          </Button>
          <Button size="icon" variant="outline" aria-label="Mover después" disabled={ocupado || ultima}
            onClick={() => correr(() => moverImagen(fila.id, 'despues'))}>
            <ArrowDown className="h-4 w-4 sm:-rotate-90" />
          </Button>
          <Button size="sm" className="ml-2" disabled={ocupado || !cambio}
            onClick={() => correr(() => guardarImagen(fila.id, altEs, altEn))}>
            Guardar
          </Button>
          <Button size="sm" variant="ghost" className="ml-auto text-destructive" disabled={ocupado} onClick={borrar}>
            Borrar
          </Button>
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

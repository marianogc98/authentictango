'use client'

import { useState, useTransition } from 'react'
import { guardarVentana } from '@/lib/admin/ventana'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Guardada = { startDate: string | null; endDate: string | null }

const ERRORES: Record<string, string> = {
  fecha_invalida: 'Alguna de las fechas no es válida.',
  rango_invalido: 'La fecha de inicio es posterior a la de fin.',
  fin_pasado: 'Esa fecha de fin ya pasó: dejaría la web sin ningún día reservable. Si querés frenar las reservas, poné la fecha de hoy.',
}

function fechaLarga(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

/** "YYYY-MM-DD" a N meses de hoy. */
function enMeses(hoy: string, meses: number) {
  const [y, m, d] = hoy.split('-').map(Number)
  const f = new Date(Date.UTC(y, m - 1 + meses, d))
  // Si el mes destino no tiene ese día (31 de enero + 1 mes), Date se corre al mes
  // siguiente. Retroceder al último día del mes buscado es lo que espera cualquiera.
  if (f.getUTCMonth() !== (m - 1 + meses) % 12) f.setUTCDate(0)
  return f.toISOString().slice(0, 10)
}

/** Último día del mes de hoy. */
function finDeMes(hoy: string) {
  const [y, m] = hoy.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
}

/**
 * El período en el que la web acepta reservas.
 *
 * Vive pegado al calendario porque es lo que explica los días punteados: sin verlos al
 * lado, una fecha de corte se convierte en un ajuste invisible que después nadie
 * recuerda haber puesto.
 */
export function SeccionVentana({ inicial, hoy }: { inicial: Guardada; hoy: string }) {
  const [desde, setDesde] = useState(inicial.startDate ?? '')
  const [hasta, setHasta] = useState(inicial.endDate ?? '')
  const [guardando, startTransition] = useTransition()
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Lo mismo que resuelve el servidor: una fecha de inicio vieja no adelanta nada.
  const desdeEfectivo = desde && desde > hoy ? desde : hoy
  const rangoDadoVuelta = Boolean(desde && hasta && desde > hasta)

  const limpiar = () => { setMensaje(null); setError(null) }

  const guardar = () =>
    startTransition(async () => {
      limpiar()
      const r = await guardarVentana(desde || null, hasta || null)

      if (!r.ok) {
        setError(ERRORES[r.error] ?? 'No se pudo guardar.')
        return
      }

      const cola = r.pagasAfuera > 0
        ? ` Ojo: ${r.pagasAfuera} reserva${r.pagasAfuera === 1 ? ' paga queda' : 's pagas quedan'} fuera del período. Siguen valiendo y las vas a ver en el calendario, pero esos días ya no se pueden reservar.`
        : ''

      setMensaje(
        (r.endDate
          ? `Guardado. Se puede reservar hasta el ${fechaLarga(r.endDate)}.`
          : 'Guardado. No hay fecha de corte: se puede reservar sin límite.') + cola,
      )
    })

  return (
    <section className="rounded-lg border border-border p-4">
      <h2 className="font-medium">Período de reservas</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Hasta cuándo la web acepta reservas nuevas. Fuera del período no se ofrece ningún
        turno, aunque tu semana diga que trabajás. No toca tus horarios ni tus días
        cerrados, y las reservas ya pagas siguen valiendo.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="desde" className="text-xs text-muted-foreground">
            Desde <span className="font-normal">(vacío = hoy)</span>
          </Label>
          <Input id="desde" type="date" min={hoy} value={desde}
            onChange={(e) => { setDesde(e.target.value); limpiar() }} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hasta" className="text-xs text-muted-foreground">
            Hasta <span className="font-normal">(vacío = sin corte)</span>
          </Label>
          <Input id="hasta" type="date" min={desde || hoy} value={hasta}
            onChange={(e) => { setHasta(e.target.value); limpiar() }} />
        </div>

        <Button onClick={guardar} disabled={guardando || rangoDadoVuelta}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Atajos:</span>
        <Atajo onClick={() => { setHasta(finDeMes(hoy)); limpiar() }}>Fin de este mes</Atajo>
        <Atajo onClick={() => { setHasta(enMeses(hoy, 3)); limpiar() }}>3 meses</Atajo>
        <Atajo onClick={() => { setHasta(enMeses(hoy, 6)); limpiar() }}>6 meses</Atajo>
        <Atajo onClick={() => { setHasta(enMeses(hoy, 12)); limpiar() }}>1 año</Atajo>
        <Button type="button" variant="ghost" size="sm"
          onClick={() => { setDesde(''); setHasta(''); limpiar() }}>
          Sin límite
        </Button>
      </div>

      <p className="mt-3 text-sm">
        {rangoDadoVuelta ? (
          <span className="text-destructive">
            El inicio es posterior al fin: así no se puede reservar ningún día.
          </span>
        ) : hasta ? (
          <>
            Se puede reservar del <strong>{fechaLarga(desdeEfectivo)}</strong> al{' '}
            <strong>{fechaLarga(hasta)}</strong>, inclusive.
          </>
        ) : (
          <>
            Se puede reservar desde el <strong>{fechaLarga(desdeEfectivo)}</strong>, sin
            fecha de corte.
          </>
        )}
      </p>

      {error && (
        <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {error}
        </p>
      )}
      {mensaje && <p className="mt-3 text-sm text-muted-foreground">{mensaje}</p>}
    </section>
  )
}

function Atajo({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      {children}
    </Button>
  )
}

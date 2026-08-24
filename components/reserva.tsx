'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { DiaPublico, SlotPublico } from '@/lib/booking/tipos'
import { useRouter } from '@/i18n/navigation'
import { formatearPrecio, hhmm } from '@/lib/booking/dinero'
import { trackGaEvent } from '@/lib/utils/gtag'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Metodo = 'paypal' | 'mercadopago'

const MESES: Record<string, string[]> = {
  es: ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
}
const DIAS_CABECERA: Record<string, string[]> = {
  es: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
}

function mesVecino(mes: string, delta: number) {
  const [y, m] = mes.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function Reserva({ locale, embebido = false }: { locale: string; embebido?: boolean }) {
  const t = useTranslations('book')
  const router = useRouter()

  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7))
  const [dias, setDias] = useState<DiaPublico[] | null>(null)
  const [hoy, setHoy] = useState<string>('')

  const [fecha, setFecha] = useState<string | null>(null)
  const [slot, setSlot] = useState<SlotPublico | null>(null)
  const [personas, setPersonas] = useState(1)
  const [metodo, setMetodo] = useState<Metodo | null>(null)

  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setDias(null)
    fetch(`/api/availability?m=${mes}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelado) return
        setDias(d.days ?? [])
        setHoy(d.today ?? '')
      })
      .catch(() => !cancelado && setDias([]))
    return () => { cancelado = true }
  }, [mes])

  // Cambiar de día invalida lo elegido después: si el horario ya no existe en el día
  // nuevo, arrastrarlo mandaría al servidor una combinación imposible.
  const elegirDia = (d: DiaPublico) => {
    setFecha(d.date)
    setError(null)
    setPersonas(1)
    // Con un solo horario no hay nada que elegir: se selecciona solo.
    setSlot(d.slots.length === 1 && d.slots[0].seatsLeft > 0 ? d.slots[0] : null)
  }

  const diaElegido = dias?.find((d) => d.date === fecha) ?? null

  const metodosPosibles = useMemo<Metodo[]>(() => {
    if (!slot) return []
    const m: Metodo[] = []
    if (slot.priceUsd > 0) m.push('paypal')
    if (slot.priceArs > 0) m.push('mercadopago')
    return m
  }, [slot])

  // Si sólo hay una forma de pago, no se pregunta.
  useEffect(() => {
    setMetodo(metodosPosibles.length === 1 ? metodosPosibles[0] : null)
  }, [metodosPosibles])

  const total = slot && metodo
    ? (metodo === 'paypal' ? slot.priceUsd : slot.priceArs) * personas
    : null

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!fecha || !slot || !metodo) return

    setEnviando(true)
    setError(null)

    const datos = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: fecha,
          time: slot.time,
          seats: personas,
          name: String(datos.get('name') ?? ''),
          email: String(datos.get('email') ?? ''),
          phone: String(datos.get('phone') ?? '') || null,
          locale,
          method: metodo,
        }),
      })

      const cuerpo = await res.json()

      if (!res.ok) {
        setError(t(`errors.${cuerpo.error}` as never) || t('errors.generic'))
        // El estado del slot cambió mientras completaba: hay que recargar.
        setMes((m) => m)
        setEnviando(false)
        return
      }

      // Sin nombre ni email: GA4 no admite datos personales. El evento
      // booking_confirmed queda para cuando el pago se acredite de verdad.
      trackGaEvent('booking_started', {
        locale,
        method: metodo,
        seats: String(personas),
        currency: cuerpo.currency,
      }).catch(() => {})

      router.push({ pathname: '/book/[uid]', params: { uid: cuerpo.uid } })
    } catch {
      setError(t('errors.generic'))
      setEnviando(false)
    }
  }

  const [anio, numMes] = mes.split('-').map(Number)
  const primerDia = new Date(Date.UTC(anio, numMes - 1, 1)).getUTCDay()
  const huecos = (primerDia + 6) % 7
  const idioma = locale === 'es' ? 'es' : 'en'

  return (
    <div className={embebido ? '' : 'mx-auto max-w-3xl'}>
      {!embebido && (
        <div className="mb-10 text-center">
        <h1 className="font-sans text-3xl font-bold text-foreground md:text-4xl">{t('title')}</h1>
        <p className="mt-3 text-muted-foreground">{t('subtitle')}</p>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        {/* Paso 1: la fecha */}
        <h2 className="mb-4 text-sm font-medium">{t('pickDate')}</h2>

        <div className="mb-3 flex items-center justify-between">
          <span className="font-medium capitalize">{MESES[idioma][numMes - 1]} {anio}</span>
          <div className="flex gap-1">
            <button type="button" aria-label={t('prev')} onClick={() => setMes((m) => mesVecino(m, -1))}
              className="rounded-md border border-border p-2 hover:bg-accent">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" aria-label={t('next')} onClick={() => setMes((m) => mesVecino(m, 1))}
              className="rounded-md border border-border p-2 hover:bg-accent">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {dias === null ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t('loading')}</p>
        ) : (
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {DIAS_CABECERA[idioma].map((c, i) => (
              <div key={i} className="pb-1 text-center text-xs text-muted-foreground">{c}</div>
            ))}
            {Array.from({ length: huecos }, (_, i) => <div key={`h${i}`} />)}

            {dias.map((d) => {
              const libres = d.slots.reduce((n, s) => n + s.seatsLeft, 0)
              const hayTurnos = d.slots.length > 0
              const disponible = hayTurnos && libres > 0
              const elegido = d.date === fecha

              return (
                <button
                  key={d.date}
                  type="button"
                  disabled={!disponible}
                  onClick={() => elegirDia(d)}
                  className={`flex aspect-square flex-col items-center justify-center rounded-md border text-sm transition-colors
                    ${elegido ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}
                    ${disponible && !elegido ? 'hover:bg-accent' : ''}
                    ${!disponible ? 'cursor-not-allowed text-muted-foreground/40' : ''}
                    ${d.date === hoy && !elegido ? 'ring-1 ring-foreground/40' : ''}`}
                >
                  <span>{Number(d.date.slice(-2))}</span>
                  {hayTurnos && libres === 0 && (
                    <span className="text-[9px] leading-none">{t('soldOut')}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Paso 2: el horario, sólo si hay más de uno */}
        {diaElegido && (
          <div className="mt-6 border-t border-border pt-6">
            {diaElegido.slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noSlots')}</p>
            ) : (
              <>
                <h2 className="mb-3 text-sm font-medium">{t('pickTime')}</h2>
                <div className="flex flex-wrap gap-2">
                  {diaElegido.slots.map((s) => {
                    const agotado = s.seatsLeft === 0
                    const activo = slot?.time === s.time
                    return (
                      <button
                        key={s.time}
                        type="button"
                        disabled={agotado}
                        onClick={() => { setSlot(s); setPersonas(1); setError(null) }}
                        className={`rounded-md border px-4 py-2 text-sm transition-colors
                          ${activo ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}
                          ${agotado ? 'cursor-not-allowed text-muted-foreground/40 line-through' : 'hover:bg-accent'}`}
                      >
                        {hhmm(s.time)}
                        {!agotado && s.seatsLeft <= 3 && (
                          <span className="ml-2 text-xs opacity-80">
                            {t('lastSeats', { n: s.seatsLeft })}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Paso 3: cuántos, datos y forma de pago */}
        {slot && slot.seatsLeft > 0 && (
          <form onSubmit={enviar} className="mt-6 space-y-6 border-t border-border pt-6">
            <div className="space-y-2">
              <Label htmlFor="personas">{t('people')}</Label>
              <select
                id="personas"
                value={personas}
                onChange={(e) => setPersonas(Number(e.target.value))}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm sm:w-40"
              >
                {Array.from({ length: Math.min(slot.seatsLeft, 20) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">{t('seatsLeft', { n: slot.seatsLeft })}</p>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-medium">{t('yourDetails')}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('name')}</Label>
                  <Input id="name" name="name" required minLength={2} maxLength={120} autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input id="email" name="email" type="email" required maxLength={200} autoComplete="email" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <Input id="phone" name="phone" type="tel" maxLength={40} autoComplete="tel" />
                </div>
              </div>
            </div>

            {metodosPosibles.length > 1 && (
              <div className="space-y-2">
                <Label>{t('payWith')}</Label>
                <div className="flex flex-wrap gap-2">
                  {metodosPosibles.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetodo(m)}
                      className={`rounded-md border px-4 py-2 text-sm transition-colors
                        ${metodo === m ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent'}`}
                    >
                      {m === 'paypal' ? 'PayPal' : 'Mercado Pago'}
                      <span className="ml-2 text-xs opacity-80">
                        {formatearPrecio(m === 'paypal' ? slot.priceUsd : slot.priceArs,
                                         m === 'paypal' ? 'USD' : 'ARS', locale)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {total !== null && metodo && (
              <div className="flex items-baseline justify-between border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">{t('total')}</span>
                <span className="text-2xl font-bold">
                  {formatearPrecio(total, metodo === 'paypal' ? 'USD' : 'ARS', locale)}
                </span>
              </div>
            )}

            {error && (
              <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                {error}
              </p>
            )}

            <div className="space-y-2">
              <Button type="submit" size="lg" className="w-full" disabled={enviando || !metodo}>
                {enviando ? t('working') : t('continue')}
              </Button>
              <p className="text-center text-xs text-muted-foreground">{t('holdNote')}</p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

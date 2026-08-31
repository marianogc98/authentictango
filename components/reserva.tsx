'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import type { DiaPublico, SlotPublico } from '@/lib/booking/tipos'
import { useRouter } from '@/i18n/navigation'
import { formatearPrecio, hhmm } from '@/lib/booking/dinero'
import { trackGaEvent } from '@/lib/utils/gtag'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Metodo = 'paypal' | 'mercadopago'

// Sólo estas claves existen en los mensajes. Si el servidor devuelve otra, se cae a
// la genérica: sin esto, un código nuevo se le muestra al visitante como
// "book.errors.loquesea", que es lo que pasó con "servidor".
const CLAVES_ERROR = new Set([
  'sin_lugar', 'cerrado', 'sin_horario', 'pasado', 'sin_precio', 'sin_clase',
  'demasiados', 'fuera_de_ventana', 'servidor', 'datos_invalidos', 'ya_pagada',
])

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

function fechaLarga(date: string, locale: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(locale === 'es' ? 'es-AR' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  })
}

export function Reserva({ locale, embebido = false }: { locale: string; embebido?: boolean }) {
  const t = useTranslations('book')
  const router = useRouter()

  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7))
  const [dias, setDias] = useState<DiaPublico[] | null>(null)
  const [hoy, setHoy] = useState<string>('')
  // Hasta dónde tiene sentido navegar. Lo decide el servidor, que es el que conoce el
  // período de reservas: sin esto las flechas llevan a meses que siempre están vacíos.
  const [limites, setLimites] = useState<{ min: string; max: string } | null>(null)

  const [fecha, setFecha] = useState<string | null>(null)
  const [slot, setSlot] = useState<SlotPublico | null>(null)
  const [personas, setPersonas] = useState(1)
  const [conClase, setConClase] = useState(false)
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
        if (d.minMonth && d.maxMonth) setLimites({ min: d.minMonth, max: d.maxMonth })
        // El servidor recorta el mes pedido al período. Si recortó, el encabezado tiene
        // que decir el mes que se está mostrando y no el que se pidió.
        if (d.month && d.month !== mes) setMes(d.month)
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
    setConClase(false)
    // Con un solo horario no hay nada que elegir: se selecciona solo.
    setSlot(d.slots.length === 1 && d.slots[0].seatsLeft > 0 ? d.slots[0] : null)
  }

  const diaElegido = dias?.find((d) => d.date === fecha) ?? null

  // Cada moneda tiene su propio precio de clase: si el horario la ofrece en dólares pero
  // no en pesos, con la clase elegida Mercado Pago deja de ser una forma de pago posible.
  // Sin este filtro se cobraría el tour solo por haber elegido la otra moneda.
  const metodosPosibles = useMemo<Metodo[]>(() => {
    if (!slot) return []
    const m: Metodo[] = []
    if (slot.priceUsd > 0 && (!conClase || slot.classPriceUsd > 0)) m.push('paypal')
    if (slot.priceArs > 0 && (!conClase || slot.classPriceArs > 0)) m.push('mercadopago')
    return m
  }, [slot, conClase])

  // La opción se ofrece sólo si queda alguna forma de pago con la que comprarla: con el
  // adicional cargado en una sola moneda, elegirla dejaba el formulario sin método y sin
  // explicación.
  const hayClase = Boolean(slot && (
    (slot.priceUsd > 0 && slot.classPriceUsd > 0) || (slot.priceArs > 0 && slot.classPriceArs > 0)
  ))

  /** El precio por persona de una opción, en todas las monedas en que se puede pagar. */
  const precioPorPersona = (clase: boolean) => {
    if (!slot) return ''
    const partes: string[] = []
    if (slot.priceUsd > 0 && (!clase || slot.classPriceUsd > 0)) {
      partes.push(formatearPrecio(slot.priceUsd + (clase ? slot.classPriceUsd : 0), 'USD', locale))
    }
    if (slot.priceArs > 0 && (!clase || slot.classPriceArs > 0)) {
      partes.push(formatearPrecio(slot.priceArs + (clase ? slot.classPriceArs : 0), 'ARS', locale))
    }
    return partes.join(' · ')
  }

  // Si sólo hay una forma de pago, no se pregunta.
  useEffect(() => {
    setMetodo(metodosPosibles.length === 1 ? metodosPosibles[0] : null)
  }, [metodosPosibles])

  const total = slot && metodo
    ? ((metodo === 'paypal' ? slot.priceUsd : slot.priceArs)
       + (conClase ? (metodo === 'paypal' ? slot.classPriceUsd : slot.classPriceArs) : 0)) * personas
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
          withClass: conClase,
          method: metodo,
        }),
      })

      const cuerpo = await res.json()

      if (!res.ok) {
        setError(t((CLAVES_ERROR.has(cuerpo.error) ? `errors.${cuerpo.error}` : 'errors.generic') as never))
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
        con_clase: conClase ? 'si' : 'no',
        currency: cuerpo.currency,
      }).catch(() => {})

      router.push({ pathname: '/book/[uid]', params: { uid: cuerpo.uid } })
    } catch {
      setError(t('errors.generic'))
      setEnviando(false)
    }
  }

  const [anio, numMes] = mes.split('-').map(Number)
  const hayAnterior = !limites || mes > limites.min
  const haySiguiente = !limites || mes < limites.max
  const primerDia = new Date(Date.UTC(anio, numMes - 1, 1)).getUTCDay()
  const huecos = (primerDia + 6) % 7
  const idioma = locale === 'es' ? 'es' : 'en'

  return (
    <div className={embebido ? '' : 'mx-auto w-full'}>
      {!embebido && (
        <div className="mb-10 text-center">
          <h1 className="font-sans text-2xl font-bold text-foreground md:text-4xl">{t('title')}</h1>
          <p className="mt-3 text-muted-foreground">{t('subtitle')}</p>
        </div>
      )}

      {/* Dos columnas en desktop: el calendario tiene ancho propio y no se estira, y el
          checkout ocupa el resto. En móvil se apilan, calendario primero. */}
      <div className="grid w-full gap-6 rounded-lg border border-border bg-card p-4 sm:p-6 md:grid-cols-[22rem_1fr] md:gap-8 lg:grid-cols-[28rem_1fr] lg:gap-10">

        {/* ── Columna izquierda: el calendario ── */}
        <div className="md:border-r md:border-border md:pr-8">
          <h2 className="mb-3 text-sm font-medium">{t('pickDate')}</h2>

          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium capitalize">{MESES[idioma][numMes - 1]} {anio}</span>
            <div className="flex gap-1">
              <button type="button" aria-label={t('prev')} disabled={!hayAnterior}
                onClick={() => setMes((m) => mesVecino(m, -1))}
                className="rounded border border-border p-1 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" aria-label={t('next')} disabled={!haySiguiente}
                onClick={() => setMes((m) => mesVecino(m, 1))}
                className="rounded border border-border p-1 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {dias === null ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t('loading')}</p>
          ) : (
            <div className="grid grid-cols-7 gap-1">
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
                    title={hayTurnos && libres === 0 ? t('soldOut') : undefined}
                    // Alto fijo en vez de aspect-square: así el alto no depende del ancho
                    // del contenedor y la celda no crece al ensancharse la columna.
                    className={`flex h-12 items-center justify-center rounded-md text-[15px] transition-colors lg:h-14 lg:text-base
                      ${elegido ? 'bg-primary font-semibold text-primary-foreground' : ''}
                      ${disponible && !elegido ? 'font-medium hover:bg-accent' : ''}
                      ${!disponible ? 'cursor-not-allowed text-muted-foreground/35' : ''}
                      ${hayTurnos && libres === 0 ? 'line-through' : ''}
                      ${d.date === hoy && !elegido ? 'ring-1 ring-inset ring-foreground/40' : ''}`}
                  >
                    {Number(d.date.slice(-2))}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Columna derecha: el checkout ── */}
        <div className="min-w-0">
          {!diaElegido ? (
            <div className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-3 text-center">
              <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
              <p className="max-w-[16rem] text-sm text-muted-foreground">{t('pickDateFirst')}</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold capitalize">{fechaLarga(diaElegido.date, locale)}</p>
                <button type="button" onClick={() => { setFecha(null); setSlot(null) }}
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                  {t('changeDate')}
                </button>
              </div>

              {diaElegido.slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noSlots')}</p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>{t('pickTime')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {diaElegido.slots.map((s) => {
                        const agotado = s.seatsLeft === 0
                        const activo = slot?.time === s.time
                        return (
                          <button
                            key={s.time}
                            type="button"
                            disabled={agotado}
                            onClick={() => { setSlot(s); setPersonas(1); setConClase(false); setError(null) }}
                            className={`rounded-md border px-3 py-1.5 text-sm transition-colors
                              ${activo ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}
                              ${agotado ? 'cursor-not-allowed text-muted-foreground/40 line-through' : 'hover:bg-accent'}`}
                          >
                            {hhmm(s.time)}
                            {!agotado && s.seatsLeft <= 3 && (
                              <span className="ml-1.5 text-xs opacity-80">
                                {t('lastSeats', { n: s.seatsLeft })}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {slot && slot.seatsLeft > 0 && (
                    <form onSubmit={enviar} className="space-y-5">
                      {hayClase && (
                        <div className="space-y-2">
                          <Label>{t('pickOption')}</Label>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {[false, true].map((clase) => (
                              <button
                                key={String(clase)}
                                type="button"
                                onClick={() => setConClase(clase)}
                                className={`rounded-md border px-3 py-2 text-left text-sm transition-colors
                                  ${conClase === clase ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent'}`}
                              >
                                <span className="block font-medium">
                                  {clase ? t('optionWithClass') : t('optionTour')}
                                </span>
                                <span className="block text-xs opacity-80">
                                  {precioPorPersona(clase)} {t('perPerson')}
                                </span>
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {conClase ? t('optionWithClassNote') : t('optionTourNote')}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="personas">{t('people')}</Label>
                        <div className="flex items-center gap-3">
                          <select
                            id="personas"
                            value={personas}
                            onChange={(e) => setPersonas(Number(e.target.value))}
                            className="h-10 w-24 rounded-md border border-border bg-background px-3 text-sm"
                          >
                            {Array.from({ length: Math.min(slot.seatsLeft, 20) }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                          <span className="text-xs text-muted-foreground">
                            {t('seatsLeft', { n: slot.seatsLeft })}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>{t('yourDetails')}</Label>
                        {/* En pantallas anchas los campos van de a dos: en una sola columna
                            de 650px quedaban inputs larguísimos con mucho aire alrededor. */}
                        <div className="grid gap-3 lg:grid-cols-2">
                          <Input name="name" placeholder={t('name')} required minLength={2} maxLength={120} autoComplete="name" />
                          <Input name="email" type="email" placeholder={t('email')} required maxLength={200} autoComplete="email" />
                          <Input name="phone" type="tel" placeholder={t('phone')} maxLength={40} autoComplete="tel" className="lg:col-span-2" />
                        </div>
                      </div>

                      {metodosPosibles.length > 1 && (
                        <div className="space-y-2">
                          <Label>{t('payWith')}</Label>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {metodosPosibles.map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setMetodo(m)}
                                className={`rounded-md border px-3 py-2 text-left text-sm transition-colors
                                  ${metodo === m ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent'}`}
                              >
                                <span className="block font-medium">
                                  {m === 'paypal' ? 'PayPal' : 'Mercado Pago'}
                                </span>
                                <span className="block text-xs opacity-80">
                                  {formatearPrecio(
                                    m === 'paypal'
                                      ? slot.priceUsd + (conClase ? slot.classPriceUsd : 0)
                                      : slot.priceArs + (conClase ? slot.classPriceArs : 0),
                                    m === 'paypal' ? 'USD' : 'ARS', locale)}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {total !== null && metodo && (
                        <div className="flex items-baseline justify-between border-t border-border pt-3">
                          <span className="text-sm text-muted-foreground">{t('total')}</span>
                          <span className="text-xl font-bold">
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
                        <Button type="submit" className="w-full" disabled={enviando || !metodo}>
                          {enviando ? t('working') : t('continue')}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">{t('holdNote')}</p>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

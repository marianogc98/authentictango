import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { CalendarDays, Clock, Users } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { getReserva } from '@/lib/booking/consulta'
import { formatearPrecio, hhmm } from '@/lib/booking/dinero'
import { PaypalBotones } from '@/components/paypal-botones'
import { PAYPAL_CLIENT_ID, paypalConfigurado } from '@/lib/payments/paypal'
import { MercadoPagoBoton } from '@/components/mercadopago-boton'
import { mpConfigurado } from '@/lib/payments/mercadopago'

// Depende del estado de una reserva concreta: nunca se prerenderiza ni se cachea.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  // Es una URL personal con datos de alguien: no se indexa nunca.
  robots: { index: false, follow: false },
}

export default async function PagoPage({
  params,
}: {
  params: Promise<{ locale: string; uid: string }>
}) {
  const { locale, uid } = await params
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'pay' })
  const reserva = await getReserva(uid)

  const fecha = reserva
    ? new Date(`${reserva.date}T12:00:00Z`).toLocaleDateString(locale === 'es' ? 'es-AR' : 'en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
      })
    : null

  const minutos = reserva
    ? Math.max(0, Math.ceil((reserva.expiresAt.getTime() - Date.now()) / 60000))
    : 0

  // Los dos precios son independientes: una reserva en pesos no se paga por PayPal.
  const puedePagarConPaypal =
    paypalConfigurado() && reserva?.currency === 'USD' && Boolean(reserva?.amount)
  const puedePagarConMp =
    mpConfigurado() && reserva?.currency === 'ARS' && Boolean(reserva?.amount)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-secondary py-16 lg:py-24">
        <div className="container mx-auto max-w-xl px-4 lg:px-8">
          {!reserva ? (
            <Aviso texto={t('notFound')}>
              <Button asChild><Link href="/book">{t('bookAgain')}</Link></Button>
            </Aviso>
          ) : reserva.status === 'paid' ? (
            <Aviso texto={t('paid')} tono="ok">
              <Button asChild variant="outline"><Link href="/">{t('backHome')}</Link></Button>
            </Aviso>
          ) : reserva.status === 'overbooked' ? (
            <Aviso texto={t('overbookedPage')}>
              <Button asChild variant="outline"><Link href="/">{t('backHome')}</Link></Button>
            </Aviso>
          ) : reserva.vencida || reserva.status === 'expired' ? (
            <Aviso texto={t('expired')}>
              <Button asChild><Link href="/book">{t('bookAgain')}</Link></Button>
            </Aviso>
          ) : (
            <div className="rounded-lg border border-border bg-card p-6">
              <h1 className="mb-6 font-sans text-2xl font-bold">{t('title')}</h1>

              <h2 className="mb-3 text-sm font-medium text-muted-foreground">{t('summary')}</h2>
              <dl className="space-y-3 border-y border-border py-4">
                <Fila icono={<CalendarDays className="h-4 w-4" />} valor={fecha!} />
                <Fila icono={<Clock className="h-4 w-4" />} valor={`${hhmm(reserva.time)} (Buenos Aires)`} />
                <Fila
                  icono={<Users className="h-4 w-4" />}
                  valor={reserva.seats === 1 ? t('person') : t('people', { n: reserva.seats })}
                />
              </dl>

              {reserva.amount != null && reserva.currency && (
                <p className="mt-4 text-right text-2xl font-bold">
                  {formatearPrecio(reserva.amount, reserva.currency as 'USD' | 'ARS', locale)}
                </p>
              )}

              {/* El método lo decide la moneda de la reserva, que se fijó al reservar:
                  los dos precios son independientes y no hay conversión entre ellos. */}
              <div className="mt-6">
                {puedePagarConPaypal ? (
                  <>
                    <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                      {t('payWithPaypal')}
                    </h2>
                    {/* El Client ID es público —viaja en el SDK igual— pero se lee en el
                        servidor y se pasa como prop: así no hace falta una NEXT_PUBLIC_*,
                        que se congelaría en el build. */}
                    <PaypalBotones
                      uid={reserva.uid}
                      clientId={PAYPAL_CLIENT_ID}
                      locale={locale}
                      seats={reserva.seats}
                    />
                  </>
                ) : puedePagarConMp ? (
                  <MercadoPagoBoton uid={reserva.uid} />
                ) : (
                  <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                    {t('notConfigured')}
                  </p>
                )}
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                {t('expiresIn', { min: minutos })}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function Fila({ icono, valor }: { icono: React.ReactNode; valor: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground">{icono}</span>
      <span className="capitalize">{valor}</span>
    </div>
  )
}

function Aviso({
  texto, tono = 'neutro', children,
}: {
  texto: string; tono?: 'neutro' | 'ok'; children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center">
      <p className={`mb-6 text-lg ${tono === 'ok' ? 'font-medium text-emerald-600 dark:text-emerald-400' : ''}`}>
        {texto}
      </p>
      {children}
    </div>
  )
}

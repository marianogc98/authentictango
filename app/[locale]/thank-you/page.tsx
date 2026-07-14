import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { ArrowLeft, Check, Sparkles } from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'thankYou' })

  return {
    title: `${t('title')} · The Authentic Tango Experience`,
    robots: { index: false, follow: false },
  }
}

export default async function ThankYouPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'thankYou' })

  // Enlace a la sección "La Experiencia" del home, respetando el idioma
  const localePrefix = locale === routing.defaultLocale ? '' : `/${locale}`
  const experienceHref = `${localePrefix}/#tours`

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-24 lg:px-8">
        {/* Imagen de fondo */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/theauthentictango/hero-tango.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Capas de oscurecimiento para legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black" />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Resplandor rojo decorativo */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }}
        />

        {/* Contenido */}
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
          {/* Ícono de confirmación */}
          <div className="mb-8 animate-in fade-in zoom-in duration-700">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-[0_0_40px_rgba(222,24,24,0.5)]">
              <Check className="h-10 w-10 text-white" strokeWidth={3} />
              <span className="absolute inset-0 rounded-full border border-white/20" />
            </div>
          </div>

          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium uppercase tracking-wider text-white/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100">
            <Sparkles className="h-4 w-4 text-primary" />
            {t('badge')}
          </div>

          {/* Título */}
          <h1 className="mb-6 text-balance font-sans text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            {t('title')}
          </h1>

          {/* Línea decorativa */}
          <div className="mb-8 h-1 w-16 rounded-full bg-primary animate-in fade-in duration-700 delay-300" />

          {/* Mensaje */}
          <p className="mb-10 max-w-xl text-pretty text-lg leading-relaxed text-white/85 md:text-xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            {t('message')}
          </p>

          {/* Acciones */}
          <div className="flex flex-col items-center gap-4 sm:flex-row animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <Button asChild size="lg" className="px-8 text-base">
              <Link href="/">
                <ArrowLeft className="mr-2 h-5 w-5" />
                {t('backHome')}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10 hover:text-white"
            >
              <a href={experienceHref}>{t('viewExperience')}</a>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

import Image from 'next/image'
import { Compass } from 'lucide-react'

/**
 * La pantalla de 404, sin nada de i18n adentro.
 *
 * Los textos y los botones entran por props porque esta misma pantalla se muestra en dos
 * contextos distintos: dentro del idioma, donde hay traducciones y navegación con locale,
 * y fuera de él —una URL con punto, que el middleware ni mira—, donde no hay ninguna de
 * las dos cosas. Con `useTranslations` acá adentro, el segundo caso reventaría.
 */
export function NoEncontrado({
  badge,
  titulo,
  mensaje,
  children,
}: {
  badge: string
  titulo: string
  mensaje: string
  /** Los botones: cambian según haya o no ruteo por idioma. */
  children: React.ReactNode
}) {
  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-black px-4 py-24 lg:px-8">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-tango.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="mb-8 animate-in fade-in zoom-in duration-700">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-sm">
            <Compass className="h-9 w-9 text-primary" strokeWidth={1.75} />
          </div>
        </div>

        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium uppercase tracking-wider text-white/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100">
          {badge}
        </div>

        <h1 className="mb-6 text-balance font-sans text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          {titulo}
        </h1>

        <div className="mb-8 h-1 w-16 rounded-full bg-primary animate-in fade-in duration-700 delay-300" />

        <p className="mb-10 max-w-xl text-pretty text-lg leading-relaxed text-white/85 md:text-xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          {mensaje}
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          {children}
        </div>
      </div>
    </main>
  )
}

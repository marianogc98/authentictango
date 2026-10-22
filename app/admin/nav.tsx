import Link from 'next/link'
import { cerrarSesion } from './actions'
import { Button } from '@/components/ui/button'

/**
 * El calendario es operar —qué viene, quién viene—, y reservas es mirar para atrás
 * —qué se vendió, cuánto entró—. La configuración de horarios no está acá porque vive
 * dentro del calendario, que es donde se usa. Referidos es aparte: no tiene fecha. Reseñas y
 * galería son contenido de la web, no operación.
 */
export function AdminNav({ activo }: { activo: 'calendario' | 'reservas' | 'referidos' | 'resenas' | 'galeria' }) {
  const clase = (id: string) =>
    `text-sm font-medium transition-colors ${
      activo === id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
    }`

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/admin" className={clase('calendario')}>Calendario</Link>
          <Link href="/admin/reservas" className={clase('reservas')}>Reservas</Link>
          <Link href="/admin/referidos" className={clase('referidos')}>Referidos</Link>
          <Link href="/admin/resenas" className={clase('resenas')}>Reseñas</Link>
          <Link href="/admin/galeria" className={clase('galeria')}>Galería</Link>
        </nav>
        <form action={cerrarSesion}>
          <Button type="submit" variant="ghost" size="sm">Salir</Button>
        </form>
      </div>
    </header>
  )
}

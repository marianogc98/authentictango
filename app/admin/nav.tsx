import Link from 'next/link'
import { cerrarSesion } from './actions'
import { Button } from '@/components/ui/button'

/**
 * El calendario es operar —qué viene, quién viene—, y reservas es mirar para atrás
 * —qué se vendió, cuánto entró—. La configuración de horarios no está acá porque vive
 * dentro del calendario, que es donde se usa. Referidos es aparte: no tiene fecha.
 */
export function AdminNav({ activo }: { activo: 'calendario' | 'reservas' | 'referidos' }) {
  const clase = (id: string) =>
    `text-sm font-medium transition-colors ${
      activo === id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
    }`

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
        <nav className="flex items-center gap-6">
          <Link href="/admin" className={clase('calendario')}>Calendario</Link>
          <Link href="/admin/reservas" className={clase('reservas')}>Reservas</Link>
          <Link href="/admin/referidos" className={clase('referidos')}>Referidos</Link>
        </nav>
        <form action={cerrarSesion}>
          <Button type="submit" variant="ghost" size="sm">Salir</Button>
        </form>
      </div>
    </header>
  )
}

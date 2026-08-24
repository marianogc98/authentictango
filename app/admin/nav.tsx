import Link from 'next/link'
import { cerrarSesion } from './actions'
import { Button } from '@/components/ui/button'

export function AdminNav({ activo }: { activo: 'calendario' | 'semana' }) {
  const clase = (id: string) =>
    `text-sm font-medium transition-colors ${
      activo === id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
    }`

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-4 py-4">
        <nav className="flex items-center gap-6">
          <Link href="/admin" className={clase('calendario')}>Calendario</Link>
          <Link href="/admin/semana" className={clase('semana')}>Mi semana</Link>
        </nav>
        <form action={cerrarSesion}>
          <Button type="submit" variant="ghost" size="sm">Salir</Button>
        </form>
      </div>
    </header>
  )
}

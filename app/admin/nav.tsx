import { cerrarSesion } from './actions'
import { Button } from '@/components/ui/button'

/**
 * El panel es una sola pantalla, así que no hay adónde navegar: la barra existe sólo
 * para saber dónde estás parada y poder salir.
 */
export function AdminNav() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-4 py-4">
        <span className="text-sm font-medium">Panel</span>
        <form action={cerrarSesion}>
          <Button type="submit" variant="ghost" size="sm">Salir</Button>
        </form>
      </div>
    </header>
  )
}

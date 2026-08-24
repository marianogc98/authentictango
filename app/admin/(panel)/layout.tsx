import React from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE, sesionValida } from '@/lib/admin/auth'

/**
 * Ésta es la barrera de seguridad del panel, y la única que cuenta.
 *
 * El chequeo del middleware es una conveniencia: evita renderizar el panel entero para
 * después mandarlo al login. Pero depende de que el `matcher` esté bien escrito, y ese
 * matcher es un regex dentro de un string: una barra invertida de menos y deja de
 * ejecutarse sin que nada falle de forma visible. Ya pasó una vez, y el panel quedó
 * accesible desde internet.
 *
 * Un layout, en cambio, corre siempre que se renderiza algo debajo suyo. No hay
 * configuración que lo saltee. Por eso el login vive fuera de este route group: acá
 * adentro, no haber iniciado sesión no es un caso posible.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies()

  if (!(await sesionValida(store.get(COOKIE)?.value))) {
    redirect('/admin/login')
  }

  return <>{children}</>
}

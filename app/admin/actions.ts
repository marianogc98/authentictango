'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE, crearSesion, panelHabilitado, passwordCorrecta } from '@/lib/admin/auth'

export async function iniciarSesion(_estado: unknown, formData: FormData) {
  if (!panelHabilitado()) {
    return { error: 'El panel no está configurado. Falta definir ADMIN_PASSWORD.' }
  }

  const intento = String(formData.get('password') ?? '')
  if (!passwordCorrecta(intento)) {
    return { error: 'Contraseña incorrecta.' }
  }

  const sesion = await crearSesion()
  if (!sesion) return { error: 'No se pudo crear la sesión.' }

  const store = await cookies()
  store.set(COOKIE, sesion.value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/admin',
    maxAge: sesion.maxAge,
  })

  const destino = String(formData.get('next') ?? '/admin')
  // Sólo rutas internas del panel: un `next` con URL absoluta sería un open redirect.
  redirect(destino.startsWith('/admin') ? destino : '/admin')
}

export async function cerrarSesion() {
  const store = await cookies()
  store.delete({ name: COOKIE, path: '/admin' })
  redirect('/admin/login')
}

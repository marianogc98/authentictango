'use client'

import { useActionState } from 'react'
import { iniciarSesion } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm({ next }: { next: string }) {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, null)

  return (
    <form action={accion} className="space-y-6">
      <input type="hidden" name="next" value={next} />

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" autoFocus required
          autoComplete="current-password" />
      </div>

      {estado?.error && (
        <p className="text-sm text-destructive" role="alert">{estado.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={pendiente}>
        {pendiente ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}

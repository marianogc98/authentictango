'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

/**
 * Botón de Mercado Pago (Checkout Pro).
 *
 * A diferencia de PayPal, acá no hay SDK ni botones embebidos: se crea la preferencia
 * en el servidor y se manda el navegador al checkout de MP. La confirmación ocurre
 * cuando vuelve, en /api/payments/mercadopago/return.
 */
export function MercadoPagoBoton({ uid }: { uid: string }) {
  const t = useTranslations('pay')
  const [estado, setEstado] = useState<'idle' | 'yendo' | 'error'>('idle')

  async function ir() {
    setEstado('yendo')
    try {
      const res = await fetch('/api/payments/mercadopago/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      })
      const cuerpo = await res.json()

      if (!res.ok || !cuerpo.url) {
        setEstado('error')
        return
      }

      window.location.href = cuerpo.url as string
    } catch {
      setEstado('error')
    }
  }

  return (
    <div className="space-y-3">
      <Button onClick={ir} disabled={estado === 'yendo'} size="lg" className="w-full">
        {estado === 'yendo' ? t('mpRedirect') : t('payWithMp')}
      </Button>

      {estado === 'error' && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {t('payError')}
        </p>
      )}
    </div>
  )
}

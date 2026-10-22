"use client"

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

/**
 * Texto que se muestra cortado a unas pocas líneas, con un "Leer más…" para desplegarlo.
 *
 * El alto se limita en `lh` —la altura de línea del propio bloque— y no con `line-clamp`,
 * que sólo corta texto corrido: acá adentro hay párrafos y listas. El botón aparece sólo
 * si de verdad hay algo cortado, así un texto corto no ofrece desplegar nada.
 *
 * El degradado es una máscara y no un color encima: la misma tarjeta va sobre fondos
 * distintos según la sección.
 */
export function Plegable({
  lineas,
  className = '',
  children,
}: {
  lineas: number
  className?: string
  children: React.ReactNode
}) {
  const t = useTranslations('common')
  const ref = useRef<HTMLDivElement>(null)
  const [abierto, setAbierto] = useState(false)
  const [desborda, setDesborda] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || abierto) return
    const medir = () => setDesborda(el.scrollHeight > el.clientHeight + 1)
    medir()
    // El ancho cambia con la pantalla, y con él cuántas líneas ocupa el texto.
    const observer = new ResizeObserver(medir)
    observer.observe(el)
    return () => observer.disconnect()
  }, [abierto])

  const cortado = desborda && !abierto

  return (
    <div>
      <div
        ref={ref}
        className={`overflow-hidden ${className} ${
          cortado ? '[mask-image:linear-gradient(to_bottom,black_60%,transparent)]' : ''
        }`}
        style={abierto ? undefined : { maxHeight: `${lineas}lh` }}
      >
        {children}
      </div>
      {desborda && (
        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          className="mt-1 text-sm font-medium text-primary hover:opacity-80 transition-opacity"
        >
          {abierto ? t('readLess') : t('readMore')}
        </button>
      )}
    </div>
  )
}

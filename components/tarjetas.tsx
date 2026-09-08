import { cn } from '@/lib/utils'

/**
 * Las tarjetas que se aceptan, dibujadas al lado de las formas de pago.
 *
 * Son SVG inline y no imágenes: son tres marcas diminutas, y bajarlas como archivos serían
 * tres pedidos más para algo que pesa menos que el HTML que lo declara. Además así heredan
 * el tamaño del texto y no parpadean al cargar.
 *
 * Las tres valen para las dos pasarelas —PayPal y Mercado Pago cobran Visa, Mastercard y
 * Amex— así que la fila se muestra una sola vez y no por botón. Lo que responde es la duda
 * de siempre: "¿tengo que abrirme una cuenta?". No: se paga con la tarjeta.
 *
 * El chip va sobre blanco fijo, no sobre el color del tema: los logos de tarjeta se leen
 * sobre claro, y en modo oscuro sobre fondo oscuro el azul de Visa desaparece.
 */

const CHIP = 'h-6 w-[38px] shrink-0 rounded-[3px] shadow-sm'

function Visa() {
  return (
    <svg viewBox="0 0 38 24" className={CHIP} role="img" aria-label="Visa">
      <rect width="38" height="24" rx="3" fill="#fff" />
      <text
        x="19"
        y="16.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="10"
        fontWeight="700"
        fontStyle="italic"
        letterSpacing="0.4"
        fill="#1434CB"
      >
        VISA
      </text>
    </svg>
  )
}

function Mastercard() {
  return (
    <svg viewBox="0 0 38 24" className={CHIP} role="img" aria-label="Mastercard">
      <rect width="38" height="24" rx="3" fill="#fff" />
      <circle cx="15.5" cy="12" r="7" fill="#EB001B" />
      {/* El amarillo semitransparente deja el naranja del cruce sin tener que dibujarlo
          aparte ni depender de mix-blend-mode. */}
      <circle cx="22.5" cy="12" r="7" fill="#F79E1B" fillOpacity="0.85" />
    </svg>
  )
}

function Amex() {
  return (
    <svg viewBox="0 0 38 24" className={CHIP} role="img" aria-label="American Express">
      <rect width="38" height="24" rx="3" fill="#1F72CD" />
      <text
        x="19"
        y="15.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="7.5"
        fontWeight="700"
        letterSpacing="0.3"
        fill="#fff"
      >
        AMEX
      </text>
    </svg>
  )
}

export function Tarjetas({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Visa />
      <Mastercard />
      <Amex />
    </div>
  )
}

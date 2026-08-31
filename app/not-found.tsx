import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NoEncontrado } from '@/components/no-encontrado'
import './globals.css'

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' })
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Página no encontrada · The Authentic Tango Experience',
  robots: { index: false, follow: false },
}

/**
 * El 404 de lo que nunca llega a tener idioma: las rutas que el middleware no mira
 * —cualquier URL con punto, como /robots.txt.bak— y un locale que no existe.
 *
 * Emite su propio <html>, porque el layout raíz es de paso: el <body> real vive en
 * app/[locale]/layout.tsx, que acá no llegó a ejecutarse. Los textos van en inglés y
 * fijos por lo mismo: sin locale resuelto no hay traducciones que pedir, y el inglés es
 * el idioma por defecto del sitio.
 */
export default function NotFoundGlobal() {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <NoEncontrado
          badge="Error 404"
          titulo="This page doesn't exist"
          mensaje="The link may be mistyped, or the page may have moved. Head back home, or take a look at the dates available for the experience."
        >
          <Button asChild size="lg" className="px-8 text-base">
            <a href="/">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back home
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10 hover:text-white"
          >
            <a href="/book">
              <CalendarDays className="mr-2 h-5 w-5" />
              See available dates
            </a>
          </Button>
        </NoEncontrado>
      </body>
    </html>
  )
}

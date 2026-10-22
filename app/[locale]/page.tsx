import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { About } from "@/components/about"
import { Services } from "@/components/services"
import { Reviews } from "@/components/reviews"
import { CustomizedTours } from "@/components/customized-tours"
import { Gallery } from "@/components/gallery"
import { Ebook } from "@/components/ebook"
import { Booking } from "@/components/booking"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"
import { alternatesFor } from '@/lib/seo/alternates'
import { JsonLd } from '@/components/JsonLd'
import { experienciaSchema, type OfertaSchema } from '@/lib/seo/schema'
import { precioDesde } from '@/lib/seo/oferta'
import { resenasPublicas } from '@/lib/resenas'

/**
 * El precio del schema y las reseñas salen de la base, así que la home deja de ser
 * puramente estática. Se sirve cacheada y se regenera como mucho una vez por minuto, que
 * no es carga. No más espaciado porque la base no es alcanzable durante el build: la
 * versión del build sale sin precio ni reseñas, y tiene que durar poco.
 *
 * Lo que ella cambia en el panel no espera a este minuto: el panel revalida la home al
 * guardar.
 */
export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  // La canonical se deriva de la ruta, nunca es un dato editable: si se pudiera
  // escribir a mano, al duplicar una página quedaría apuntando a la anterior.
  return {
    alternates: alternatesFor(locale, '/'),
  }
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'services' })
  const [precios, resenas] = await Promise.all([precioDesde(), resenasPublicas(locale)])

  // Las dos experiencias son ofertas del mismo recorrido, y cada una se declara sólo si
  // hoy hay algún horario que la venda: prometerle a Google un precio que el checkout no
  // puede cobrar es peor que no declararlo.
  const ofertas: OfertaSchema[] = [
    ...(precios?.tour ? [{ nombre: t('private.title'), centavosUsd: precios.tour }] : []),
    ...(precios?.conClase ? [{ nombre: t('group.title'), centavosUsd: precios.conClase }] : []),
  ]

  return (
    <>
      <JsonLd
        data={experienciaSchema(locale, {
          nombre: t('private.title'),
          descripcion: t('private.description'),
          ofertas,
        })}
      />
      <Header />
      <main>
        <Hero />
        {/* Las experiencias van primero: son lo que se vende. Quién las guía va después
            de reservar, para quien quiere saber más antes de escribir. */}
        <Services precios={precios} />
        <Reviews resenas={resenas} />
        <CustomizedTours />
        <Gallery />
        <Ebook />
        <Booking />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  )
}

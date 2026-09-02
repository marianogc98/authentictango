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

/**
 * El precio del schema sale de la base, así que la home deja de ser puramente estática.
 * Con revalidación por hora sigue sirviéndose cacheada: el precio no cambia varias veces
 * al día, y una consulta por hora no es carga.
 */
export const revalidate = 3600

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
  const precios = await precioDesde()

  // Cada variante es una oferta del mismo viaje, no dos productos distintos: es el mismo
  // recorrido, con o sin la clase grupal.
  const ofertas: OfertaSchema[] = precios
    ? [
        { nombre: t('private.title'), centavosUsd: precios.tour },
        ...(precios.conClase
          ? [{ nombre: t('group.title'), centavosUsd: precios.conClase }]
          : []),
      ]
    : []

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
        <About />
        <Services />
        <Reviews />
        <CustomizedTours />
        <Gallery />
        <Ebook />
        <Booking />
        <Contact />
      </main>
      <Footer />
    </>
  )
}

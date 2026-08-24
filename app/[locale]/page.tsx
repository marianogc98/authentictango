import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
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

  return (
    <>
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

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

export default function Home() {
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

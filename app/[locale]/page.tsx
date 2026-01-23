import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { About } from "@/components/about"
import { Services } from "@/components/services"
import { Gallery } from "@/components/gallery"
import { Booking } from "@/components/booking"
import { Ebook } from "@/components/ebook"
import { Contact } from "@/components/contact"

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Services />
        <Gallery />
        <Booking />
        <Ebook />
        <Contact />
      </main>
    </>
  )
}

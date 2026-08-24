import React from "react"

/**
 * Layout raíz de paso. El <html> y el <body> viven en app/[locale]/layout.tsx,
 * que es el único punto donde se conoce el idioma: así `lang` se emite desde el
 * servidor y no por un efecto en el cliente, que los crawlers no ejecutan.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}

/**
 * Inyecta un bloque de datos estructurados schema.org.
 *
 * El escape de "<" evita que un texto con markup pueda cerrar la etiqueta <script>
 * y alterar el HTML de la página.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\u003c') }}
    />
  )
}

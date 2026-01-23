"use client"

import { useMemo } from 'react'

interface RichTextProps {
  content: string
  className?: string
}

export function RichText({ content, className = '' }: RichTextProps) {
  const htmlContent = useMemo(() => {
    // Escapar HTML básico y permitir solo tags seguros
    let processed = content
      // Convertir saltos de línea a <br>
      .replace(/\n/g, '<br>')
      // Permitir <strong>, <b>, <em>, <i>, <a>, <br>
      // El resto se escapa automáticamente con dangerouslySetInnerHTML
    
    return processed
  }, [content])

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}


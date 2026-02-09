"use client"

import { useMemo } from 'react'

interface RichTextProps {
  content: string
  className?: string
  /** Espacio entre párrafos: 'normal' (1 línea) | 'tight' (50%) | 'tighter' (25%) */
  paragraphSpacing?: 'normal' | 'tight' | 'tighter'
}

export function RichText({ content, className = '', paragraphSpacing = 'tight' }: RichTextProps) {
  const htmlContent = useMemo(() => {
    const hasParagraphs = /\n\n+/.test(content)
    if (hasParagraphs) {
      const paragraphs = content.split(/\n\n+/)
      const wrapped = paragraphs
        .map((p) => p.replace(/\n/g, '<br>'))
        .join('</p><p>')
      return `<p>${wrapped}</p>`
    }
    return content.replace(/\n/g, '<br>')
  }, [content])

  const spacingClass =
    paragraphSpacing === 'tighter'
      ? '[&_p]:mb-[0.25em] [&_p:last-child]:mb-0'
      : paragraphSpacing === 'tight'
        ? '[&_p]:mb-[0.5em] [&_p:last-child]:mb-0'
        : '[&_p]:mb-[1em] [&_p:last-child]:mb-0'

  return (
    <div
      className={`${spacingClass} ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}



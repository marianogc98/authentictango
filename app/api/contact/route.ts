import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, subject, interestType, message } = body

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email and message are required' },
        { status: 400 }
      )
    }

    const to = process.env.CONTACT_EMAIL
    if (!to) {
      console.error('CONTACT_EMAIL is not set')
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set')
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      )
    }

    const from = process.env.FROM_EMAIL || 'The Authentic Tango Experience <onboarding@resend.dev>'
    const html = `
      <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Asunto:</strong> ${escapeHtml(subject || '—')}</p>
      ${interestType ? `<p><strong>Tipo de interés:</strong> ${escapeHtml(interestType)}</p>` : ''}
      <p><strong>Mensaje:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
    `

    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: subject ? `Contacto: ${subject}` : 'Nuevo mensaje de contacto',
      html,
      replyTo: email,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('Contact API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return String(text).replace(/[&<>"']/g, (m) => map[m])
}

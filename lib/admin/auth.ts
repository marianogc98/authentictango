/**
 * Autenticación del panel. Hay una sola usuaria, así que una contraseña compartida y
 * una cookie firmada alcanzan: NextAuth o un modelo de usuarios sería toda la
 * complejidad de un sistema multiusuario para administrar un único acceso.
 *
 * Se usa Web Crypto y no node:crypto porque esto también corre en el middleware, que
 * va en el runtime Edge y no tiene los módulos de Node.
 */

export const COOKIE = 'tango_admin'
const DIAS = 30

function claveSecreta(): string | null {
  const p = process.env.ADMIN_PASSWORD?.trim()
  return p && p.length >= 8 ? p : null
}

async function firmar(mensaje: string, secreto: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secreto),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(mensaje))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Comparación en tiempo constante: un `===` filtra cuántos caracteres coincidían. */
function igualSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let dif = 0
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return dif === 0
}

/** Valor de la cookie para una sesión que arranca ahora. */
export async function crearSesion(): Promise<{ value: string; maxAge: number } | null> {
  const secreto = claveSecreta()
  if (!secreto) return null

  const vence = Date.now() + DIAS * 24 * 60 * 60 * 1000
  const firma = await firmar(String(vence), secreto)
  return { value: `${vence}.${firma}`, maxAge: DIAS * 24 * 60 * 60 }
}

/**
 * Valida la cookie. Como la firma usa la contraseña como clave, cambiar la contraseña
 * invalida todas las sesiones abiertas, que es justo lo que se espera.
 */
export async function sesionValida(cookie: string | undefined): Promise<boolean> {
  const secreto = claveSecreta()
  if (!secreto || !cookie) return false

  const [vence, firma] = cookie.split('.')
  if (!vence || !firma) return false
  if (!Number.isFinite(Number(vence)) || Number(vence) < Date.now()) return false

  return igualSeguro(firma, await firmar(vence, secreto))
}

/** ¿La contraseña tipeada es la correcta? */
export function passwordCorrecta(intento: string): boolean {
  const secreto = claveSecreta()
  if (!secreto) return false
  return igualSeguro(intento, secreto)
}

/** Si no hay ADMIN_PASSWORD configurada, el panel se apaga entero en vez de quedar abierto. */
export function panelHabilitado(): boolean {
  return claveSecreta() !== null
}

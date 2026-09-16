import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { SITE_HOST } from './lib/site';
import { COOKIE, sesionValida } from './lib/admin/auth';
import { COOKIE_REFERIDO, DIAS_REFERIDO, codigoValido } from './lib/booking/referidos';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // Un solo hostname canónico. El www resuelve por CNAME al mismo servidor, así que
  // sin esto Google ve dos sitios idénticos (los dos con 200) y parte la señal al medio.
  const host = request.headers.get('host');
  if (host && host !== SITE_HOST && host.replace(/^www\./, '') === SITE_HOST) {
    const url = new URL(request.url);
    url.host = SITE_HOST;
    url.protocol = 'https:';
    url.port = '';
    return NextResponse.redirect(url, 308);
  }

  const { pathname } = request.nextUrl;

  // El panel queda fuera del ruteo por idioma: es para una sola persona y sólo en
  // español, así que no tiene sentido que arrastre prefijos de locale.
  //
  // Este chequeo es una conveniencia —evita renderizar el panel para después mandarlo
  // al login—, NO la barrera de seguridad. La barrera está en el layout de
  // app/admin/(panel), que corre siempre. Ver el comentario del matcher.
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next();

    if (await sesionValida(request.cookies.get(COOKIE)?.value)) {
      return NextResponse.next();
    }

    const login = new URL('/admin/login', request.url);
    // Para volver a donde quería entrar después de autenticarse.
    if (pathname !== '/admin') login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  const response = intlMiddleware(request);

  // Quien entra por un link de referido se queda con el descuento aunque después cambie
  // de idioma: el selector arma una URL nueva y los UTM no viajan. Se guarda sólo si el
  // código es uno conocido, y el último link por el que se entró es el que vale.
  const referido = codigoValido(request.nextUrl.searchParams.get('utm_source'));
  if (referido) {
    response.cookies.set(COOKIE_REFERIDO, referido, {
      path: '/',
      maxAge: DIAS_REFERIDO * 24 * 60 * 60,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      // Legible desde el navegador a propósito: el checkout la lee para mostrar el
      // descuento antes de reservar. No es un secreto; el servidor la revalida al cobrar.
      httpOnly: false,
    });
  }

  return response;
}

export const config = {
  // Excluye /api, /_next, /_vercel y cualquier ruta con punto (archivos estáticos).
  //
  // Ojo con el escapado: hacen falta DOS barras invertidas para que el regex reciba
  // `\.`. Con una sola, '\.' se colapsa a '.', el patrón queda `.*..*` —que matchea
  // cualquier ruta no vacía—, el lookahead negativo falla siempre, y el middleware
  // deja de correr en todas las rutas salvo `/`. Es una falla silenciosa: no rompe
  // nada, simplemente deja de ejecutarse.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

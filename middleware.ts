import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { SITE_HOST } from './lib/site';
import { COOKIE, sesionValida } from './lib/admin/auth';

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

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\..*).*)']
};

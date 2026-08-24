import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { SITE_HOST } from './lib/site';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
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

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\..*).*)']
};

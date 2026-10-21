import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  // Si ya está logueado, no tiene sentido mostrarle el login.
  if (pathname === '/login') {
    return session
      ? NextResponse.redirect(new URL('/', request.url))
      : NextResponse.next();
  }

  // El login (y el logout) tienen que poder llamarse sin sesión.
  if (pathname === '/api/auth/login' || pathname === '/api/auth/logout') {
    return NextResponse.next();
  }

  if (session) return NextResponse.next();

  // Las llamadas a la API reciben 401 en vez de un redirect a HTML.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: [
    // Todo excepto assets estáticos, el manifest y el ícono de la PWA.
    '/((?!_next/static|_next/image|favicon.ico|favicon.png|manifest.json|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?)$).*)',
  ],
};

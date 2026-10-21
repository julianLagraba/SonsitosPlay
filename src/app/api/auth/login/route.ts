import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  validateCredentials,
} from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: { username?: unknown; password?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const username = typeof body.username === 'string' ? body.username : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Ingresá usuario y contraseña' },
      { status: 400 }
    );
  }

  if (!validateCredentials(username, password)) {
    // Pequeña demora para frenar intentos de fuerza bruta.
    await new Promise((resolve) => setTimeout(resolve, 400));
    return NextResponse.json(
      { error: 'Usuario o contraseña incorrectos' },
      { status: 401 }
    );
  }

  const token = await createSessionToken(username.trim());
  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}

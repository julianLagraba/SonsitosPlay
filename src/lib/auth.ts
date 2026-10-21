// Autenticación de un solo usuario.
// Este módulo se usa tanto en middleware (edge) como en route handlers (node),
// por eso solo depende de Web Crypto y no de módulos de Node.

export const SESSION_COOKIE = 'sonsitos_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

// Credenciales por defecto. Se pueden pisar con variables de entorno
// (AUTH_USERNAME / AUTH_PASSWORD) sin tocar el código.
const DEFAULT_USERNAME = 'julianOrnella';
const DEFAULT_PASSWORD = 'Sonsitos1234';

const encoder = new TextEncoder();

function getUsername() {
  return process.env.AUTH_USERNAME?.trim() || DEFAULT_USERNAME;
}

function getPassword() {
  return process.env.AUTH_PASSWORD || DEFAULT_PASSWORD;
}

function getSecret() {
  return (
    process.env.AUTH_SECRET ||
    `${getUsername()}:${getPassword()}:sonsitosplay-session`
  );
}

/** Comparación en tiempo constante para no filtrar información por timing. */
function safeEqual(a: string, b: string) {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const length = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;

  for (let i = 0; i < length; i += 1) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }

  return diff === 0;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return toBase64Url(new Uint8Array(signature));
}

export function validateCredentials(username: string, password: string) {
  const userOk = safeEqual(username.trim(), getUsername());
  const passwordOk = safeEqual(password, getPassword());
  return userOk && passwordOk;
}

export async function createSessionToken(username: string) {
  const payload = toBase64Url(
    encoder.encode(
      JSON.stringify({
        u: username,
        exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
      })
    )
  );
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = await sign(payload);
  if (!safeEqual(signature, expected)) return null;

  try {
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as {
      u?: string;
      exp?: number;
    };

    if (!data.u || !data.exp) return null;
    if (data.exp <= Math.floor(Date.now() / 1000)) return null;
    if (!safeEqual(data.u, getUsername())) return null;

    return { username: data.u };
  } catch {
    return null;
  }
}

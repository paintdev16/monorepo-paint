import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const baseUrl = (process.env.AUTH_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/' };
type Tokens = { accessToken: string; refreshToken: string; expiresIn: number };

async function backend(path: string, options: RequestInit = {}) {
  return fetch(`${baseUrl}/auth/${path}`, { ...options, cache: 'no-store', headers: { 'Content-Type': 'application/json', ...options.headers } });
}

async function saveTokens(tokens: Tokens) {
  const store = await cookies();
  store.set('paint_access', tokens.accessToken, { ...cookieOptions, maxAge: tokens.expiresIn });
  store.set('paint_refresh', tokens.refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 });
}

async function clearTokens() {
  const store = await cookies();
  store.delete('paint_access'); store.delete('paint_refresh');
}

async function freshAccess() {
  const store = await cookies();
  let access = store.get('paint_access')?.value;
  if (access) {
    const me = await backend('me', { headers: { Authorization: `Bearer ${access}` } });
    if (me.ok) return { access, user: await me.json() };
    if (me.status !== 401) throw new Error('backend unavailable');
  }
  const refresh = store.get('paint_refresh')?.value;
  if (!refresh) return null;
  const result = await backend('refresh', { method: 'POST', body: JSON.stringify({ refreshToken: refresh }) });
  if (!result.ok) {
    if (result.status !== 401) throw new Error('backend unavailable');
    await clearTokens(); return null;
  }
  const tokens: Tokens = await result.json();
  await saveTokens(tokens);
  access = tokens.accessToken;
  const me = await backend('me', { headers: { Authorization: `Bearer ${access}` } });
  if (!me.ok) throw new Error('backend unavailable');
  return { access, user: await me.json() };
}

export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return NextResponse.json({ message: 'Solicitud no permitida.' }, { status: 403 });
  const { action } = await params;
  try {
    if (action === 'login' || action === 'register') {
      const body = await request.json();
      if (action === 'register') {
        const registered = await backend('register', { method: 'POST', body: JSON.stringify(body) });
        if (!registered.ok) return NextResponse.json({ message: registered.status === 409 ? 'Este correo ya está registrado.' : 'No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo.' }, { status: registered.status });
      }
      const login = await backend('login', { method: 'POST', body: JSON.stringify({ email: body.email, password: body.password }) });
      if (!login.ok) return NextResponse.json({ message: action === 'register' ? 'La cuenta se creó, pero no pudimos iniciar sesión. Inténtalo desde la página de acceso.' : login.status === 401 ? 'El correo o la contraseña son incorrectos.' : 'No se pudo iniciar sesión. Inténtalo de nuevo.' }, { status: login.status });
      await saveTokens(await login.json());
      return NextResponse.json({ ok: true });
    }
    if (action === 'session') {
      const session = await freshAccess();
      return session ? NextResponse.json({ user: session.user }) : NextResponse.json({ message: 'Sesión no válida.' }, { status: 401 });
    }
    if (action === 'logout') {
      const session = await freshAccess();
      if (session) {
        const result = await backend('logout', { method: 'POST', headers: { Authorization: `Bearer ${session.access}` } });
        if (!result.ok && result.status !== 401) throw new Error('backend unavailable');
      }
      await clearTokens(); return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ message: 'No encontrado.' }, { status: 404 });
  } catch {
    return NextResponse.json({ message: 'No pudimos conectar con el servidor. Inténtalo de nuevo.' }, { status: 503 });
  }
}

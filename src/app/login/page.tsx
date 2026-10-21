'use client';

import { useState } from 'react';
import { Eye, EyeOff, Loader2, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo iniciar sesión');
      }

      // Recarga completa para que el middleware tome la cookie nueva.
      window.location.assign('/');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo iniciar sesión'
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/favicon.png"
            alt="SonsitosPlay"
            className="w-20 h-20 rounded-2xl object-cover shadow-lg shadow-black/40"
          />
          <h1 className="mt-4 text-2xl font-bold text-white">SonsitosPlay</h1>
          <p className="mt-1 text-sm text-white/50">
            Ingresá a tu lista de películas y series
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass rounded-3xl p-6 space-y-4 shadow-2xl shadow-black/40"
        >
          <div>
            <label
              htmlFor="username"
              className="block mb-1.5 text-sm font-medium text-white/70"
            >
              Usuario
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Tu usuario"
                required
                className="w-full rounded-2xl bg-white/5 border border-white/10 py-3 pl-11 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent/60 transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block mb-1.5 text-sm font-medium text-white/70"
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Tu contraseña"
                required
                className="w-full rounded-2xl bg-white/5 border border-white/10 py-3 pl-11 pr-12 text-white placeholder:text-white/30 focus:outline-none focus:border-accent/60 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={
                  showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-white/40 hover:text-white/80 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-300 fade-in"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3 font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-wait"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/30">
          Tus datos quedan guardados en tu cuenta.
        </p>
      </div>
    </main>
  );
}

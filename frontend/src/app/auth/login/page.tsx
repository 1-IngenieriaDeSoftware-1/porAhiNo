/**
 * Página: Login
 *
 * Autenticación de usuarios (conductores y admins).
 * TODO: Implementar con AuthContext y authService
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  description: 'Accede a tu cuenta de porAhiNo.',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-700">porAhiNo</h1>
          <p className="text-gray-500 mt-1">Inicia sesión en tu cuenta</p>
        </div>

        <form className="space-y-4" id="form-login">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              className="input-base"
              placeholder="tu@correo.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className="input-base"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button id="btn-login" type="submit" className="btn-primary w-full">
            Iniciar sesión
          </button>
        </form>

        {/* TODO: <LinkRegistro /> */}
      </div>
    </main>
  );
}

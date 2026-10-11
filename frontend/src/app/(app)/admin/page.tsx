'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { ROUTES } from '@/lib/routes';

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <main className="px-4 py-8 max-w-6xl mx-auto">
        <p className="text-gray-500">Cargando…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="px-4 py-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-primary-700 mb-4">Panel de administración</h1>
        <div className="card space-y-3" role="alert">
          <p className="text-gray-600">
            Debes iniciar sesión con una cuenta de administrador (JWT + rol admin) para usar este
            panel (US-004.1).
          </p>
          <Link href={ROUTES.login} className="btn-primary inline-block" id="admin-login-link">
            Entrar como admin
          </Link>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="px-4 py-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-primary-700 mb-4">Acceso denegado</h1>
        <div className="card space-y-3" role="alert">
          <p className="text-gray-600">
            Tu cuenta (<span className="font-medium">{user.email}</span>) es de conductor. El panel
            admin y <code>/api/v1/admin/*</code> requieren rol <strong>admin</strong> (HTTP 403).
          </p>
          <Link href={ROUTES.home} className="text-primary-700 font-medium hover:underline">
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-primary-700 mb-2">Panel de administración</h1>
      <p className="text-gray-500 text-sm mb-6">
        Sesión admin: <span className="font-medium text-gray-700">{user.email}</span>
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card" id="admin-panel-decretos">
          <h2 className="text-xl font-semibold mb-4">Decretos</h2>
          <p className="text-gray-500 text-sm">
            Acceso autorizado (US-004.1). El CRUD de decretos se completa en US-004.2 sobre{' '}
            <code>/api/v1/admin/decretos</code>.
          </p>
        </div>
        <div className="card" id="admin-panel-municipios">
          <h2 className="text-xl font-semibold mb-4">Municipios</h2>
          <p className="text-gray-500 text-sm">
            Catálogo Bogotá, Medellín y Cali vía seed. Alta de municipios: mismo router admin
            protegido con JWT + rol admin.
          </p>
        </div>
      </div>
    </main>
  );
}

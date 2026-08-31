'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { ROUTES } from '@/lib/routes';

export default function AdminPage() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <main className="px-4 py-8 max-w-6xl mx-auto">
        <p className="text-gray-500">Cargando…</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="px-4 py-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-primary-700 mb-4">Panel de administración</h1>
        <div className="card space-y-3">
          <p className="text-gray-600">Solo el administrador del sistema (STK-002) puede actualizar decretos (US-004).</p>
          <Link href={ROUTES.login} className="btn-primary inline-block">
            Entrar como admin
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-primary-700 mb-6">Panel de administración</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Decretos</h2>
          <p className="text-gray-500 text-sm">
            Cascarón listo para US-004. El backend exige JWT + rol admin en{' '}
            <code>/api/v1/admin/decretos</code>.
          </p>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Municipios</h2>
          <p className="text-gray-500 text-sm">
            Catálogo Bogotá, Medellín y Cali vía seed. Alta de municipios: mismo router admin.
          </p>
        </div>
      </div>
    </main>
  );
}

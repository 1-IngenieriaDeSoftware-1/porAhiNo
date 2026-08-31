'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { ROUTES } from '@/lib/routes';

export default function VehiculosPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="px-4 py-8 max-w-4xl mx-auto">
        <p className="text-gray-500">Cargando…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="px-4 py-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary-700 mb-4">Mis vehículos</h1>
        <div className="card space-y-3">
          <p className="text-gray-600">
            Para registrar y guardar placas (US-001 / US-006) inicia sesión.
          </p>
          <Link href={ROUTES.login} className="btn-primary inline-block">
            Iniciar sesión
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary-700">Mis vehículos</h1>
        <button id="btn-agregar-vehiculo" type="button" className="btn-primary" disabled>
          + Agregar vehículo
        </button>
      </div>
      <div className="card">
        <p className="text-gray-500 text-sm">
          El CRUD de vehículos se implementa en US-001 (uno) y US-006 (varios). La ruta y el
          cliente HTTP ya están conectados a <code>/api/v1/vehiculos</code>.
        </p>
      </div>
    </main>
  );
}

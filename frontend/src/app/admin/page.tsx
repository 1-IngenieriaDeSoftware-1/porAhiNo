/**
 * Página: Panel de Administración (US-004)
 *
 * Gestión de decretos de Pico y Placa y municipios.
 * Acceso exclusivo para usuarios con rol ADMIN.
 *
 * TODO: Conectar con AdminService → API REST + protección de ruta
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel Admin',
  description: 'Panel de administración de decretos de Pico y Placa.',
};

export default function AdminPage() {
  return (
    <main className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-primary-700 mb-6">
        Panel de Administración
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sección Decretos */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">📋 Decretos</h2>
          <p className="text-gray-500 text-sm">
            [Tabla de decretos — pendiente implementación]
          </p>
          <button id="btn-nuevo-decreto" className="btn-primary mt-4">
            + Nuevo decreto
          </button>
        </div>

        {/* Sección Municipios */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">🏙️ Municipios</h2>
          <p className="text-gray-500 text-sm">
            [Tabla de municipios — pendiente implementación]
          </p>
          <button id="btn-nuevo-municipio" className="btn-primary mt-4">
            + Nuevo municipio
          </button>
        </div>
      </div>
    </main>
  );
}

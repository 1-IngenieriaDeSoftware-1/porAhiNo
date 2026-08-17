/**
 * Página: Mis Vehículos (US-001, US-006)
 *
 * Lista y gestión de vehículos registrados por el usuario conductor.
 * Requiere autenticación.
 *
 * TODO: Conectar con VehiculosService → API REST
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mis Vehículos',
  description: 'Gestiona tus vehículos registrados para consultas rápidas de Pico y Placa.',
};

export default function VehiculosPage() {
  return (
    <main className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary-700">Mis Vehículos</h1>
        <button id="btn-agregar-vehiculo" className="btn-primary">
          + Agregar vehículo
        </button>
      </div>

      {/* TODO: <ListaVehiculos /> cuando AuthContext esté implementado */}
      <div className="card">
        <p className="text-gray-500 text-sm">
          [Lista de vehículos — requiere autenticación]
        </p>
      </div>
    </main>
  );
}

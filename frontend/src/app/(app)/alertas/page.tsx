import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Alertas preventivas',
  description: 'Configura alertas de Pico y Placa para tu vehículo.',
};

export default function AlertasPage() {
  return (
    <main className="px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-primary-700 mb-4">Alertas preventivas</h1>
      <div className="card">
        <p className="text-gray-600">
          US-005 (Could, Release 2). El modelo <code>alertas</code> ya está en el esquema de base de
          datos; la lógica de notificaciones no forma parte del MVP.
        </p>
      </div>
    </main>
  );
}

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
          Pronto podrás configurar recordatorios antes del Pico y Placa. Esta función aún no está
          disponible en la versión actual.
        </p>
      </div>
    </main>
  );
}

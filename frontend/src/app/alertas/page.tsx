/**
 * Página: Alertas Preventivas (US-005) — RELEASE 2
 *
 * Permite configurar notificaciones push antes de que inicie la restricción.
 *
 * TODO (Release 2): Implementar con Web Push API y backend AlertasService
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Alertas Preventivas',
  description: 'Configura alertas de Pico y Placa para tu vehículo.',
};

export default function AlertasPage() {
  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-primary-700 mb-4">🔔 Alertas Preventivas</h1>
      <div className="card">
        <p className="text-gray-600">
          Esta funcionalidad estará disponible en la próxima versión de porAhiNo.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Recibe notificaciones antes de que inicie tu restricción de Pico y Placa.
        </p>
        {/* TODO (Release 2): <ConfiguradorAlertas /> */}
      </div>
    </main>
  );
}

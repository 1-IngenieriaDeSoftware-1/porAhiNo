import type { Metadata } from 'next';
import AlertasPushPanel from '@/components/alertas/AlertasPushPanel';

export const metadata: Metadata = {
  title: 'Alertas preventivas',
  description: 'Configura alertas de Pico y Placa para tu vehículo.',
};

export default function AlertasPage() {
  return (
    <main className="px-4 py-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-700 mb-2">Alertas preventivas</h1>
        <p className="text-ink-600 text-sm">
          MainV2: avisos el día anterior si tu placa tiene restricción, con enlace a navegación
          alternativa.
        </p>
      </div>
      <AlertasPushPanel />
      <div className="card text-sm text-ink-600">
        Tip: también puedes crear suscripciones por vehículo en el backend (`alertas` table). El job
        `POST /api/v1/push/avisos-manana` (admin) revisa restricciones de mañana y envía push si VAPID
        está configurado.
      </div>
    </main>
  );
}

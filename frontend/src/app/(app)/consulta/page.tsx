import type { Metadata } from 'next';
import ConsultaView from '@/components/consulta/ConsultaView';

export const metadata: Metadata = {
  title: 'Consultar Pico y Placa',
  description: 'Consulta si tu vehículo tiene restricción de Pico y Placa por municipio y fecha.',
};

export default function ConsultaPage() {
  return (
    <main className="px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-primary-700 mb-2">Consultar Pico y Placa</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Ingresa la placa y el municipio. La consulta es pública: no necesitas cuenta (US-002).
      </p>
      <div className="card">
        <ConsultaView />
      </div>
    </main>
  );
}

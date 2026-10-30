import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'Navegación Pico y Placa | porAhiNo MainV2',
  description: 'Rutas alternativas evitando zonas de Pico y Placa',
};

const NavegacionMap = dynamic(() => import('@/components/navegacion/NavegacionMap'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-ink-100 bg-white p-8 text-center text-ink-500">
      Cargando mapa…
    </div>
  ),
});

export default function NavegacionPage() {
  return (
    <main className="px-4 py-6 max-w-7xl mx-auto">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-wide text-primary-600 font-semibold">MainV2 experimental</p>
        <h1 className="text-3xl font-bold text-primary-800">Navegación con Pico y Placa</h1>
        <p className="text-ink-600 mt-1 max-w-2xl">
          Rutas por vías reales (OSRM) con desvío por corredores laterales. Marca origen y destino
          en el mismo municipio; si tu placa está restringida, verás la alternativa que evita la
          zona.
        </p>
      </header>
      <NavegacionMap />
    </main>
  );
}

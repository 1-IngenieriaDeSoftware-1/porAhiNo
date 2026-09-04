import type { Metadata } from 'next';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'porAhiNo — Consulta tu Pico y Placa',
};

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-extrabold text-primary-700 tracking-tight">
            porAhiNo
          </h1>
          <p className="text-gray-500 text-lg md:text-xl">
            Consulta tu restricción de{' '}
            <span className="font-semibold text-primary-600">Pico y Placa</span> en Colombia
          </p>
        </div>

        <Link
          href={ROUTES.consulta}
          id="cta-consultar"
          className="btn-primary inline-block text-lg px-8 py-4 animate-slide-up"
        >
          Consultar restricción
        </Link>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {[
            { title: 'Por municipio', desc: 'Bogotá, Medellín, Cali y más' },
            { title: 'En tiempo real', desc: 'Objetivo: respuesta en menos de 1 segundo' },
            { title: 'PWA', desc: 'Instálala como app en tu móvil' },
          ].map((f) => (
            <div key={f.title} className="card text-left space-y-1">
              <h3 className="font-semibold text-gray-800">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

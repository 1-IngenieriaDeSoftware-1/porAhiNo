/**
 * Página principal — porAhiNo
 *
 * Landing page con acceso directo a la consulta de Pico y Placa.
 * Redirige a /consulta para la funcionalidad principal.
 * Responsive desde 360px hasta 1920px.
 */

import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'porAhiNo — Consulta tu Pico y Placa',
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
        {/* Logo / Brand */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-extrabold text-primary-700 tracking-tight">
            🚗 porAhiNo
          </h1>
          <p className="text-gray-500 text-lg md:text-xl">
            Consulta tu restricción de{' '}
            <span className="font-semibold text-primary-600">Pico y Placa</span>{' '}
            en Colombia
          </p>
        </div>

        {/* CTA principal */}
        <Link
          href="/consulta"
          id="cta-consultar"
          className="btn-primary inline-block text-lg px-8 py-4 animate-slide-up"
        >
          Consultar restricción →
        </Link>

        {/* Features rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {[
            { icon: '📍', title: 'Por municipio', desc: 'Bogotá, Medellín, Cali y más' },
            { icon: '⚡', title: 'En tiempo real', desc: 'Respuesta en menos de 1 segundo' },
            { icon: '📱', title: 'PWA', desc: 'Instálala como app en tu móvil' },
          ].map((f) => (
            <div key={f.title} className="card text-left space-y-1">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="font-semibold text-gray-800">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

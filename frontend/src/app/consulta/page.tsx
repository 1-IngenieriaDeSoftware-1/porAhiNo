/**
 * Página: Consulta de Pico y Placa (US-002, US-003)
 *
 * Permite ingresar placa, seleccionar municipio y opcionalmente
 * una fecha/hora para consultar la restricción.
 *
 * TODO: Conectar con ConsultaService → API REST
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Consultar Pico y Placa',
  description: 'Consulta si tu vehículo tiene restricción de Pico y Placa por municipio y fecha.',
};

export default function ConsultaPage() {
  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-primary-700 mb-6">
        Consultar Pico y Placa
      </h1>

      {/* TODO: Reemplazar por <ConsultaForm /> cuando esté implementado */}
      <div className="card space-y-4">
        <p className="text-gray-500 text-sm">
          [Formulario de consulta — pendiente implementación]
        </p>

        <div className="space-y-3">
          <div>
            <label htmlFor="placa" className="block text-sm font-medium text-gray-700 mb-1">
              Placa del vehículo
            </label>
            <input
              id="placa"
              type="text"
              placeholder="ABC123"
              className="input-base uppercase"
              maxLength={6}
            />
          </div>

          <div>
            <label htmlFor="municipio" className="block text-sm font-medium text-gray-700 mb-1">
              Municipio
            </label>
            <select id="municipio" className="input-base">
              <option value="">Selecciona un municipio...</option>
              {/* TODO: Cargar desde /api/v1/consulta/municipios */}
            </select>
          </div>

          <button id="btn-consultar" className="btn-primary w-full">
            Consultar restricción
          </button>
        </div>
      </div>

      {/* TODO: <ResultadoConsulta /> */}
    </main>
  );
}

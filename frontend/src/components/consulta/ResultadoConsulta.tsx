'use client';

import Card from '@/components/ui/Card';
import type { ConsultaResponseAPI } from '@/types/api';

interface ResultadoConsultaProps {
  resultado?: ConsultaResponseAPI | null;
}

export default function ResultadoConsulta({ resultado }: ResultadoConsultaProps) {
  if (!resultado) return null;

  return (
    <Card
      id="resultado-consulta"
      elevated
      className={resultado.tiene_restriccion ? 'border-red-200 bg-red-50/20' : 'border-green-200 bg-green-50/20'}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl" aria-hidden>
          {resultado.tiene_restriccion ? '🚫' : '✅'}
        </span>
        <div>
          <p className="font-bold text-xl text-gray-900">{resultado.placa}</p>
          <p className="text-gray-500 text-sm">{resultado.municipio}</p>
        </div>
        <span
          id="badge-estado-restriccion"
          className={`ml-auto ${resultado.tiene_restriccion ? 'badge-restringido' : 'badge-libre'}`}
        >
          {resultado.tiene_restriccion ? '¡Pico y Placa Activo!' : 'Sin restricción'}
        </span>
      </div>

      {resultado.tiene_restriccion ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-2">
          <h4 className="text-red-800 font-bold mb-1">¡Pico y Placa Activo!</h4>
          {resultado.detalle ? (
            <div className="text-red-700 text-sm space-y-1">
              <p>
                Tu vehículo tiene restricción de movilidad desde las <strong>{resultado.detalle.hora_inicio}</strong> hasta las <strong>{resultado.detalle.hora_fin}</strong>.
              </p>
              {resultado.detalle.digitos_restringidos && (
                <p>
                  <strong>Dígitos restringidos:</strong> {resultado.detalle.digitos_restringidos.join(', ')}
                </p>
              )}
              {resultado.detalle.descripcion && (
                <p className="text-red-600 text-xs italic mt-1">{resultado.detalle.descripcion}</p>
              )}
            </div>
          ) : (
            <p className="text-red-700 text-sm">{resultado.mensaje}</p>
          )}
        </div>
      ) : (
        <p className="text-gray-700">{resultado.mensaje}</p>
      )}
    </Card>
  );
}

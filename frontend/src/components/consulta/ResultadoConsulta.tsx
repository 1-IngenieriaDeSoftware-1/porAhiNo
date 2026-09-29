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
      <p className="text-gray-700">{resultado.mensaje}</p>

      {resultado.detalle && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600 space-y-1">
          <p>
            <span className="font-semibold text-gray-700">Horario de restricción:</span>{' '}
            {resultado.detalle.hora_inicio} - {resultado.detalle.hora_fin}
          </p>
          {resultado.detalle.digitos_restringidos && (
            <p>
              <span className="font-semibold text-gray-700">Dígitos restringidos:</span>{' '}
              {resultado.detalle.digitos_restringidos.join(', ')}
            </p>
          )}
          {resultado.detalle.descripcion && (
            <p className="text-gray-500 text-xs italic">{resultado.detalle.descripcion}</p>
          )}
        </div>
      )}
    </Card>
  );
}

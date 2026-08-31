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
      className={resultado.tiene_restriccion ? 'border-red-200' : 'border-green-200'}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl" aria-hidden>
          {resultado.tiene_restriccion ? '🚫' : '✅'}
        </span>
        <div>
          <p className="font-bold text-xl text-gray-900">{resultado.placa}</p>
          <p className="text-gray-500 text-sm">{resultado.municipio}</p>
        </div>
        <span className={`ml-auto ${resultado.tiene_restriccion ? 'badge-restringido' : 'badge-libre'}`}>
          {resultado.tiene_restriccion ? 'Pico y Placa Activo' : 'Sin restricción'}
        </span>
      </div>
      <p className="text-gray-700">{resultado.mensaje}</p>
    </Card>
  );
}

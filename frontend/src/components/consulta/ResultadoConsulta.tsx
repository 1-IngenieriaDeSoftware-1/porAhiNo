/**
 * Componente: ResultadoConsulta
 *
 * Muestra el resultado de una consulta de Pico y Placa.
 * Dos estados: restringido (rojo) o libre (verde).
 *
 * TODO: Recibir props de ConsultaResponse del backend
 */

import Card from '@/components/ui/Card';

interface ResultadoConsultaProps {
  // TODO: Tipar con ConsultaResponse del types/api.ts
  resultado?: {
    placa: string;
    municipio: string;
    tiene_restriccion: boolean;
    mensaje: string;
  };
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
        <span className="text-4xl">
          {resultado.tiene_restriccion ? '🚫' : '✅'}
        </span>
        <div>
          <p className="font-bold text-xl text-gray-900">{resultado.placa}</p>
          <p className="text-gray-500 text-sm">{resultado.municipio}</p>
        </div>
        <span
          className={`ml-auto ${
            resultado.tiene_restriccion ? 'badge-restringido' : 'badge-libre'
          }`}
        >
          {resultado.tiene_restriccion ? 'Restringido' : 'Libre'}
        </span>
      </div>
      <p className="text-gray-700">{resultado.mensaje}</p>
    </Card>
  );
}

'use client';

import Card from '@/components/ui/Card';
import type { ConsultaResponseAPI } from '@/types/api';

interface ResultadoConsultaProps {
  resultado?: ConsultaResponseAPI | null;
}

export default function ResultadoConsulta({ resultado }: ResultadoConsultaProps) {
  if (!resultado) return null;

  const restringido = resultado.tiene_restriccion;

  return (
    <Card
      id="resultado-consulta"
      elevated
      className={`overflow-hidden border border-ink-100 border-l-[3px] ${
        restringido ? 'border-l-danger' : 'border-l-success'
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
            restringido ? 'bg-danger/12 text-danger' : 'bg-success/12 text-success'
          }`}
          aria-hidden
        >
          {restringido ? (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 8v5m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <div className="min-w-0">
          <p className="font-bold text-xl text-ink-900 tracking-tight">{resultado.placa}</p>
          <p className="text-ink-500 text-sm">{resultado.municipio}</p>
        </div>
        <span
          id="badge-estado-restriccion"
          className={`ml-auto shrink-0 ${restringido ? 'badge-restringido' : 'badge-libre'}`}
        >
          {restringido ? 'Pico y Placa activo' : 'Sin restricción'}
        </span>
      </div>

      {restringido ? (
        <div
          className="rounded-xl border border-danger/20 bg-danger-light/80 p-4 mt-2"
          id="alerta-con-restriccion"
        >
          <h4 className="text-danger-dark font-semibold mb-1">Pico y Placa activo</h4>
          {resultado.detalle ? (
            <div className="text-danger-dark/90 text-sm space-y-1">
              <p>
                Tu vehículo tiene restricción de movilidad desde las{' '}
                <strong>{resultado.detalle.hora_inicio}</strong> hasta las{' '}
                <strong>{resultado.detalle.hora_fin}</strong>.
              </p>
              {resultado.detalle.digitos_restringidos && (
                <p>
                  <strong>Dígitos restringidos:</strong>{' '}
                  {resultado.detalle.digitos_restringidos.join(', ')}
                </p>
              )}
              {resultado.detalle.descripcion && (
                <p className="text-danger/80 text-xs mt-1">{resultado.detalle.descripcion}</p>
              )}
            </div>
          ) : (
            <p className="text-danger-dark/90 text-sm">{resultado.mensaje}</p>
          )}
        </div>
      ) : (
        <div
          className="rounded-xl border border-success/20 bg-success-light/80 p-4 mt-2"
          id="confirmacion-sin-restriccion"
        >
          <h4 className="text-success-dark font-semibold mb-1">Sin restricción</h4>
          <p className="text-success-dark/90 text-sm">{resultado.mensaje}</p>
        </div>
      )}
    </Card>
  );
}

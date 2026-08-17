/**
 * Hook: useConsulta
 *
 * Encapsula la lógica de estado para la consulta de Pico y Placa.
 * Separa la lógica de los componentes UI.
 *
 * TODO: Implementar lógica completa
 */

'use client';

import { useState } from 'react';
import consultaService, { type ConsultaRequest, type ConsultaResponse } from '@/services/consultaService';

interface UseConsultaReturn {
  resultado: ConsultaResponse | null;
  loading: boolean;
  error: string | null;
  consultar: (payload: ConsultaRequest) => Promise<void>;
  limpiar: () => void;
}

export function useConsulta(): UseConsultaReturn {
  const [resultado, setResultado] = useState<ConsultaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const consultar = async (payload: ConsultaRequest) => {
    setLoading(true);
    setError(null);
    try {
      const data = await consultaService.verificarRestriccion(payload);
      setResultado(data);
    } catch (err: unknown) {
      setError('Error al consultar la restricción. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const limpiar = () => {
    setResultado(null);
    setError(null);
  };

  return { resultado, loading, error, consultar, limpiar };
}

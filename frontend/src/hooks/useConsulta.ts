'use client';

import { useState } from 'react';
import consultaService from '@/services/consultaService';
import type { ConsultaRequestAPI, ConsultaResponseAPI } from '@/types/api';

interface UseConsultaReturn {
  resultado: ConsultaResponseAPI | null;
  loading: boolean;
  error: string | null;
  consultar: (payload: ConsultaRequestAPI) => Promise<void>;
  limpiar: () => void;
}

export function useConsulta(): UseConsultaReturn {
  const [resultado, setResultado] = useState<ConsultaResponseAPI | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const consultar = async (payload: ConsultaRequestAPI) => {
    setLoading(true);
    setError(null);
    try {
      const data = await consultaService.verificarRestriccion(payload);
      setResultado(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
      if (axiosErr.response?.status === 501) {
        setError(axiosErr.response.data?.detail || 'La consulta aún no está implementada en el backend (US-002).');
      } else {
        setError(axiosErr.response?.data?.detail || 'Error al consultar la restricción. Intenta de nuevo.');
      }
      setResultado(null);
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

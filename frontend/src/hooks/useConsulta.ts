'use client';

import { useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import consultaService from '@/services/consultaService';
import type { ConsultaRequestAPI, ConsultaResponseAPI } from '@/types/api';

interface UseConsultaReturn {
  resultado: ConsultaResponseAPI | null;
  loading: boolean;
  consultar: (payload: ConsultaRequestAPI) => Promise<void>;
  limpiar: () => void;
}

export function useConsulta(): UseConsultaReturn {
  const { error: toastError } = useToast();
  const [resultado, setResultado] = useState<ConsultaResponseAPI | null>(null);
  const [loading, setLoading] = useState(false);

  const consultar = async (payload: ConsultaRequestAPI) => {
    setLoading(true);
    try {
      const data = await consultaService.verificarRestriccion(payload);
      setResultado(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
      const detail =
        axiosErr.response?.status === 501
          ? axiosErr.response.data?.detail || 'La consulta aún no está implementada en el backend (US-002).'
          : axiosErr.response?.data?.detail || 'Error al consultar la restricción. Intenta de nuevo.';
      toastError(detail);
      setResultado(null);
    } finally {
      setLoading(false);
    }
  };

  const limpiar = () => {
    setResultado(null);
  };

  return { resultado, loading, consultar, limpiar };
}

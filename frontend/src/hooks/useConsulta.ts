'use client';

import { useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { apiErrorMessage } from '@/lib/utils';
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
      const status = (err as { response?: { status?: number } }).response?.status;
      toastError(
        apiErrorMessage(
          err,
          status === 501
            ? 'La consulta aún no está disponible en el servidor. Intenta más tarde.'
            : 'Error al consultar la restricción. Intenta de nuevo.',
        ),
      );
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

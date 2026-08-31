'use client';

import ConsultaForm from '@/components/consulta/ConsultaForm';
import ResultadoConsulta from '@/components/consulta/ResultadoConsulta';
import { useConsulta } from '@/hooks/useConsulta';

export default function ConsultaView() {
  const { resultado, loading, error, consultar } = useConsulta();

  return (
    <div className="space-y-6">
      <ConsultaForm onSubmit={consultar} loading={loading} />
      {error && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3" role="alert">
          {error}
        </p>
      )}
      <ResultadoConsulta resultado={resultado} />
    </div>
  );
}

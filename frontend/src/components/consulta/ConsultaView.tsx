'use client';

import { Suspense } from 'react';
import ConsultaForm from '@/components/consulta/ConsultaForm';
import ResultadoConsulta from '@/components/consulta/ResultadoConsulta';
import { useConsulta } from '@/hooks/useConsulta';

export default function ConsultaView() {
  const { resultado, loading, consultar } = useConsulta();

  return (
    <div className="space-y-6">
      <Suspense fallback={<p className="text-sm text-ink-500">Cargando formulario…</p>}>
        <ConsultaForm onSubmit={consultar} loading={loading} />
      </Suspense>
      <ResultadoConsulta resultado={resultado} />
    </div>
  );
}

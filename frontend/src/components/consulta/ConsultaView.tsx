'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ConsultaForm from '@/components/consulta/ConsultaForm';
import ResultadoConsulta from '@/components/consulta/ResultadoConsulta';
import MapaMunicipios from '@/components/consulta/MapaMunicipios';
import { useConsulta } from '@/hooks/useConsulta';
import type { MunicipioAPI } from '@/types/api';

function ConsultaContent() {
  const { resultado, loading, consultar } = useConsulta();
  const searchParams = useSearchParams();
  const [vista, setVista] = useState<'formulario' | 'mapa'>('formulario');
  const [municipioId, setMunicipioId] = useState<string>('');
  const [mensajeSeleccion, setMensajeSeleccion] = useState<string | null>(null);

  useEffect(() => {
    const vistaParam = searchParams.get('vista');
    if (vistaParam === 'mapa') {
      setVista('mapa');
    }
    const munParam = searchParams.get('municipio_id');
    if (munParam) {
      setMunicipioId(munParam);
    }
  }, [searchParams]);

  const handleSeleccionarEnMapa = (municipio: MunicipioAPI) => {
    setMunicipioId(String(municipio.id));
    setMensajeSeleccion(`Municipio seleccionado: ${municipio.nombre} (${municipio.departamento})`);
    setVista('formulario');
    setTimeout(() => {
      setMensajeSeleccion(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Pestañas de Navegación entre Formulario y Mapa */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
        <button
          type="button"
          id="tab-formulario"
          onClick={() => setVista('formulario')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            vista === 'formulario'
              ? 'bg-primary-50 text-primary-800 shadow-sm border border-primary-200'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <span>📋</span>
          <span>Formulario</span>
        </button>
        <button
          type="button"
          id="tab-mapa"
          onClick={() => setVista('mapa')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            vista === 'mapa'
              ? 'bg-primary-50 text-primary-800 shadow-sm border border-primary-200'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <span>🗺️</span>
          <span>Mapa de municipios</span>
        </button>
      </div>

      {mensajeSeleccion && (
        <div
          role="status"
          className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between animate-fadeIn"
        >
          <span className="flex items-center gap-2">
            <span>✅</span>
            <span>{mensajeSeleccion}</span>
          </span>
          <button
            type="button"
            onClick={() => setMensajeSeleccion(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            ✕
          </button>
        </div>
      )}

      {vista === 'formulario' ? (
        <div className="space-y-6">
          <ConsultaForm
            onSubmit={consultar}
            loading={loading}
            municipioSeleccionadoId={municipioId}
            onAbrirMapa={() => setVista('mapa')}
          />
          <ResultadoConsulta resultado={resultado} />
        </div>
      ) : (
        <div className="pt-2">
          <MapaMunicipios
            municipioSeleccionadoId={municipioId}
            onSeleccionarMunicipio={handleSeleccionarEnMapa}
          />
        </div>
      )}
    </div>
  );
}

export default function ConsultaView() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-500">Cargando consulta…</p>}>
      <ConsultaContent />
    </Suspense>
  );
}

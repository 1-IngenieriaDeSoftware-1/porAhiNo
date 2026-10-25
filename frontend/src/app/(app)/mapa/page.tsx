'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MapaMunicipios from '@/components/consulta/MapaMunicipios';
import { ROUTES } from '@/lib/routes';
import type { MunicipioAPI } from '@/types/api';

export default function MapaPage() {
  const router = useRouter();

  const handleSeleccionar = (municipio: MunicipioAPI) => {
    // Redirige al formulario de consulta con el municipio preseleccionado (flujo US-002/US-003)
    router.push(`${ROUTES.consulta}?municipio_id=${municipio.id}`);
  };

  return (
    <main className="px-4 py-8 max-w-5xl mx-auto space-y-6">
      <div className="card shadow-sm p-6 sm:p-8">
        <MapaMunicipios
          onSeleccionarMunicipio={handleSeleccionar}
          titulo="Mapa de Municipios con Restricción"
          subtitulo="Visualiza los municipios del territorio nacional con decreto de Pico y Placa vigente. Haz clic en un municipio para iniciar tu consulta de restricción vehicular (US-003.3)."
        />
      </div>
    </main>
  );
}

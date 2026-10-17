'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { VehiculoAPI } from '@/types/api';
import { ROUTES } from '@/lib/routes';
import vehiculosService from '@/services/vehiculosService';

interface VehiculoCardProps {
  vehiculo: VehiculoAPI;
  onDelete: (id: number) => void;
}

const ICONO_TIPO: Record<string, { label: string; icon: string }> = {
  particular: { label: 'Particular', icon: '🚗' },
  moto: { label: 'Motocicleta', icon: '🏍️' },
  taxi: { label: 'Taxi', icon: '🚕' },
  carga: { label: 'Carga', icon: '🚚' },
  publico: { label: 'Público', icon: '🚌' },
};

export default function VehiculoCard({ vehiculo, onDelete }: VehiculoCardProps) {
  const [eliminando, setEliminando] = useState(false);

  const infoTipo = ICONO_TIPO[vehiculo.tipo] || { label: vehiculo.tipo, icon: '🚘' };

  const handleEliminar = async () => {
    if (!window.confirm(`¿Estás seguro de eliminar el vehículo ${vehiculo.placa}?`)) {
      return;
    }

    setEliminando(true);
    try {
      await vehiculosService.eliminarVehiculo(vehiculo.id);
      onDelete(vehiculo.id);
    } catch {
      alert('Error al eliminar el vehículo');
      setEliminando(false);
    }
  };

  return (
    <div className="card flex items-center justify-between hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {/* Icono de tipo */}
        <div className="w-12 h-12 rounded-2xl bg-primary-50 text-2xl flex items-center justify-center">
          {infoTipo.icon}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xl font-bold text-gray-900 tracking-wider">
              {vehiculo.placa}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 font-semibold text-gray-600">
              {infoTipo.label}
            </span>
          </div>

          {vehiculo.alias && (
            <p className="text-sm text-gray-600 mt-0.5">{vehiculo.alias}</p>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1">
        <Link
          href={`${ROUTES.consulta}?placa=${encodeURIComponent(vehiculo.placa)}`}
          className="text-primary-700 hover:bg-primary-50 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
          id={`btn-consultar-${vehiculo.id}`}
        >
          Consultar
        </Link>
        <button
          onClick={handleEliminar}
          disabled={eliminando}
          className="text-gray-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium"
          title="Eliminar vehículo"
          type="button"
        >
          {eliminando ? '…' : '🗑️'}
        </button>
      </div>
    </div>
  );
}

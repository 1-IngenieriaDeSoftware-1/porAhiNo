'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { VehiculoAPI } from '@/types/api';
import { ROUTES } from '@/lib/routes';
import { useToast } from '@/providers/ToastProvider';
import ConfirmModal from '@/components/ui/ConfirmModal';
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
  const { error: toastError, success } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const infoTipo = ICONO_TIPO[vehiculo.tipo] || { label: vehiculo.tipo, icon: '🚘' };

  const handleConfirmEliminar = async () => {
    setEliminando(true);
    try {
      await vehiculosService.eliminarVehiculo(vehiculo.id);
      setConfirmOpen(false);
      onDelete(vehiculo.id);
      success(`Vehículo ${vehiculo.placa} eliminado`);
    } catch {
      toastError('Error al eliminar el vehículo');
      setEliminando(false);
    }
  };

  return (
    <>
      <div className="card flex items-center justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-2xl flex items-center justify-center">
            {infoTipo.icon}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold text-ink-900 tracking-wider">
                {vehiculo.placa}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-ink-100 font-semibold text-ink-600">
                {infoTipo.label}
              </span>
            </div>

            {vehiculo.alias && <p className="text-sm text-ink-600 mt-0.5">{vehiculo.alias}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={`${ROUTES.consulta}?placa=${encodeURIComponent(vehiculo.placa)}`}
            className="text-primary-700 hover:bg-primary-50 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
            id={`btn-consultar-${vehiculo.id}`}
          >
            Consultar
          </Link>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={eliminando}
            className="text-ink-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium"
            title="Eliminar vehículo"
            type="button"
            aria-label={`Eliminar vehículo ${vehiculo.placa}`}
          >
            🗑️
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        danger
        loading={eliminando}
        title="Eliminar vehículo"
        description={`¿Estás seguro de eliminar el vehículo ${vehiculo.placa}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onCancel={() => {
          if (!eliminando) setConfirmOpen(false);
        }}
        onConfirm={handleConfirmEliminar}
      />
    </>
  );
}

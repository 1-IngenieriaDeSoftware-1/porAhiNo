'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { ROUTES } from '@/lib/routes';
import vehiculosService from '@/services/vehiculosService';
import type { VehiculoAPI } from '@/types/api';
import VehiculoFormModal from '@/components/vehiculos/VehiculoFormModal';
import VehiculoCard from '@/components/vehiculos/VehiculoCard';

export default function VehiculosPage() {
  const { user, loading: authLoading } = useAuth();
  const [vehiculos, setVehiculos] = useState<VehiculoAPI[]>([]);
  const [loadingVehiculos, setLoadingVehiculos] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const cargarVehiculos = useCallback(async () => {
    if (!user) return;
    setLoadingVehiculos(true);
    setErrorText(null);
    try {
      const data = await vehiculosService.listarVehiculos();
      setVehiculos(data);
    } catch {
      setErrorText('No se pudieron cargar tus vehículos. Intenta nuevamente.');
    } finally {
      setLoadingVehiculos(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      cargarVehiculos();
    }
  }, [user, cargarVehiculos]);

  const handleVehiculoCreado = (nuevo: VehiculoAPI) => {
    setVehiculos((prev) => [nuevo, ...prev]);
  };

  const handleVehiculoEliminado = (id: number) => {
    setVehiculos((prev) => prev.filter((v) => v.id !== id));
  };

  if (authLoading) {
    return (
      <main className="px-4 py-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-xl w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded-2xl w-full"></div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="px-4 py-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary-700 mb-4">Mis vehículos</h1>
        <div className="card space-y-4 text-center py-10">
          <div className="text-5xl">🚗</div>
          <h2 className="text-xl font-semibold text-gray-800">Inicia sesión para gestionar tus vehículos</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Registra tus vehículos para consultar automáticamente restricciones de Pico y Placa y recibir alertas.
          </p>
          <div>
            <Link href={ROUTES.login} className="btn-primary inline-block">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 max-w-4xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Mis vehículos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra tus vehículos registrados para consultas rápidas
          </p>
        </div>
        <button
          id="btn-agregar-vehiculo"
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <span>+</span>
          <span>Agregar vehículo</span>
        </button>
      </div>

      {/* Alerta de Error si ocurre en el GET */}
      {errorText && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
          <span>⚠️ {errorText}</span>
          <button onClick={cargarVehiculos} className="underline font-semibold hover:text-red-900">
            Reintentar
          </button>
        </div>
      )}

      {/* Estado de Carga */}
      {loadingVehiculos ? (
        <div className="space-y-3">
          <div className="h-20 bg-gray-100 animate-pulse rounded-2xl"></div>
          <div className="h-20 bg-gray-100 animate-pulse rounded-2xl"></div>
        </div>
      ) : vehiculos.length === 0 ? (
        /* Estado Vacío */
        <div className="card text-center py-12 space-y-4 border-dashed border-2 border-gray-200">
          <div className="text-4xl">🚘</div>
          <h3 className="text-lg font-semibold text-gray-800">Aún no tienes vehículos registrados</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Agrega la placa y tipo de tu vehículo para saber en segundos si tienes Pico y Placa.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-primary inline-block"
          >
            + Registrar mi primer vehículo
          </button>
        </div>
      ) : (
        /* Lista de Vehículos */
        <div id="lista-vehiculos" className="grid grid-cols-1 gap-4">
          {vehiculos.map((v) => (
            <VehiculoCard
              key={v.id}
              vehiculo={v}
              onDelete={handleVehiculoEliminado}
            />
          ))}
        </div>
      )}

      {/* Modal de Registro de Vehículo */}
      <VehiculoFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleVehiculoCreado}
      />
    </main>
  );
}

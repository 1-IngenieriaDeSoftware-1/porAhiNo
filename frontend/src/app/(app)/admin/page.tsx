'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { ROUTES } from '@/lib/routes';
import adminService from '@/services/adminService';
import type { DecretoAPI, MunicipioAPI } from '@/types/api';
import DecretoFormModal from '@/components/admin/DecretoFormModal';

const NOMBRES_DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function formatearDias(diasStr: string): string {
  const numeros = diasStr
    .split(',')
    .map((d) => parseInt(d.trim(), 10))
    .filter((d) => !isNaN(d) && d >= 0 && d <= 6);
  if (numeros.length === 5 && numeros.every((val, i) => val === i)) {
    return 'Lun a Vie';
  }
  return numeros.map((d) => NOMBRES_DIAS[d]).join(', ');
}

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { error: toastError, success } = useToast();
  const [decretos, setDecretos] = useState<DecretoAPI[]>([]);
  const [municipios, setMunicipios] = useState<MunicipioAPI[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Modal de creación / edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [decretoSeleccionado, setDecretoSeleccionado] = useState<DecretoAPI | null>(null);

  const cargarDatos = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingData(true);
    try {
      const [muns, decs] = await Promise.all([
        adminService.listarMunicipios(),
        adminService.listarDecretos(),
      ]);
      setMunicipios(muns);
      setDecretos(decs);
    } catch {
      toastError('No se pudieron cargar los datos de administración. Intenta nuevamente.');
    } finally {
      setLoadingData(false);
    }
  }, [isAdmin, toastError]);

  useEffect(() => {
    if (isAdmin) {
      cargarDatos();
    }
  }, [isAdmin, cargarDatos]);

  const handleCrearNuevo = () => {
    setDecretoSeleccionado(null);
    setIsModalOpen(true);
  };

  const handleEditar = (decreto: DecretoAPI) => {
    setDecretoSeleccionado(decreto);
    setIsModalOpen(true);
  };

  const handleDesactivar = async (decreto: DecretoAPI) => {
    if (!window.confirm(`¿Deseas desactivar el decreto "${decreto.numero_decreto || decreto.id}"?`)) {
      return;
    }
    try {
      await adminService.eliminarDecreto(decreto.id);
      setDecretos((prev) =>
        prev.map((d) => (d.id === decreto.id ? { ...d, is_active: false } : d))
      );
      success('Decreto desactivado');
    } catch {
      toastError('Error al desactivar el decreto.');
    }
  };

  const handleSuccessModal = (decretoGuardado: DecretoAPI, isEdit: boolean) => {
    if (isEdit) {
      setDecretos((prev) =>
        prev.map((d) => (d.id === decretoGuardado.id ? decretoGuardado : d))
      );
    } else {
      setDecretos((prev) => [decretoGuardado, ...prev]);
    }
  };

  const getNombreMunicipio = (id: number): string => {
    const mun = municipios.find((m) => m.id === id);
    return mun ? mun.nombre : `Municipio #${id}`;
  };

  if (authLoading) {
    return (
      <main className="px-4 py-8 max-w-6xl mx-auto">
        <p className="text-gray-500">Cargando…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="px-4 py-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-primary-700 mb-4">Panel de administración</h1>
        <div className="card space-y-3" role="alert">
          <p className="text-gray-600">
            Debes iniciar sesión con una cuenta de administrador (JWT + rol admin) para usar este
            panel (US-004.1).
          </p>
          <Link href={ROUTES.login} className="btn-primary inline-block" id="admin-login-link">
            Entrar como admin
          </Link>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="px-4 py-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-primary-700 mb-4">Acceso denegado</h1>
        <div className="card space-y-3" role="alert">
          <p className="text-gray-600">
            Tu cuenta (<span className="font-medium">{user.email}</span>) es de conductor. El panel
            admin y <code>/api/v1/admin/*</code> requieren rol <strong>admin</strong> (HTTP 403).
          </p>
          <Link href={ROUTES.home} className="text-primary-700 font-medium hover:underline">
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 max-w-6xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Gestión de Decretos de Pico y Placa</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra el calendario, rangos horarios y dígitos vigentes por municipio (US-004)
          </p>
        </div>
        <button
          id="btn-crear-decreto"
          type="button"
          onClick={handleCrearNuevo}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <span>+</span>
          <span>Nuevo Decreto</span>
        </button>
      </div>

      {loadingData ? (
        <div className="card animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      ) : decretos.length === 0 ? (
        <div className="card text-center py-12 space-y-3 border-dashed border-2 border-gray-200">
          <div className="text-4xl">📜</div>
          <h3 className="text-lg font-semibold text-gray-800">No hay decretos registrados</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Crea el primer decreto para activar la restricción de movilidad en un municipio.
          </p>
          <button type="button" onClick={handleCrearNuevo} className="btn-primary inline-block">
            + Crear primer decreto
          </button>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Municipio</th>
                <th className="py-3 px-4">Decreto / Descripción</th>
                <th className="py-3 px-4">Horario</th>
                <th className="py-3 px-4">Días</th>
                <th className="py-3 px-4">Dígitos</th>
                <th className="py-3 px-4">Vigencia</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {decretos.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-gray-900">
                    {getNombreMunicipio(d.municipio_id)}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-gray-800">{d.numero_decreto || 'Sin número'}</p>
                    {d.descripcion && <p className="text-xs text-gray-500">{d.descripcion}</p>}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs font-semibold text-primary-700">
                    {d.hora_inicio.slice(0, 5)} - {d.hora_fin.slice(0, 5)}
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">{formatearDias(d.dias_restriccion)}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs font-bold text-gray-800">
                      {d.digitos_restringidos}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-500">
                    {d.vigencia_desde} {d.vigencia_hasta ? `a ${d.vigencia_hasta}` : '(Indefinido)'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        d.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500 line-through'
                      }`}
                    >
                      {d.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleEditar(d)}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-800 px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                      type="button"
                    >
                      Editar
                    </button>
                    {d.is_active && (
                      <button
                        onClick={() => handleDesactivar(d)}
                        className="text-xs font-semibold text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        type="button"
                      >
                        Desactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <DecretoFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccessModal}
        decretoAEditar={decretoSeleccionado}
        municipios={municipios}
      />
    </main>
  );
}

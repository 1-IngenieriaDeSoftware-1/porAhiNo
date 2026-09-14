'use client';

import React, { useState } from 'react';
import vehiculosService from '@/services/vehiculosService';
import type { TipoVehiculo, VehiculoAPI } from '@/types/api';
import { formatPlaca, validarPlaca, PLACA_MENSAJE_ERROR } from '@/lib/placa';

interface VehiculoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newVehiculo: VehiculoAPI) => void;
}

const TIPOS_VEHICULO: { value: TipoVehiculo; label: string; icon: string }[] = [
  { value: 'particular', label: 'Particular', icon: '🚗' },
  { value: 'moto', label: 'Motocicleta', icon: '🏍️' },
  { value: 'taxi', label: 'Taxi', icon: '🚕' },
  { value: 'carga', label: 'Vehículo de Carga', icon: '🚚' },
  { value: 'publico', label: 'Transporte Público', icon: '🚌' },
];

export default function VehiculoFormModal({
  isOpen,
  onClose,
  onSuccess,
}: VehiculoFormModalProps) {
  const [placaInput, setPlacaInput] = useState('');
  const [tipo, setTipo] = useState<TipoVehiculo>('particular');
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [touchedPlaca, setTouchedPlaca] = useState(false);

  if (!isOpen) return null;

  const placaFormateada = formatPlaca(placaInput);
  const esPlacaValida = validarPlaca(placaFormateada);
  const mostrarErrorPlaca = touchedPlaca && placaInput.trim().length > 0 && !esPlacaValida;

  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlacaInput(e.target.value.toUpperCase());
    setErrorApi(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedPlaca(true);

    if (!esPlacaValida) {
      return;
    }

    setLoading(true);
    setErrorApi(null);

    try {
      const nuevoVehiculo = await vehiculosService.crearVehiculo({
        placa: placaFormateada,
        tipo,
        alias: alias.trim() || undefined,
      });

      // Limpiar formulario
      setPlacaInput('');
      setAlias('');
      setTipo('particular');
      setTouchedPlaca(false);

      onSuccess(nuevoVehiculo);
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { detail?: string | Array<{ msg: string }> }; status?: number } }).response;
        if (response?.status === 422) {
          setErrorApi(PLACA_MENSAJE_ERROR);
        } else if (typeof response?.data?.detail === 'string') {
          setErrorApi(response.data.detail);
        } else if (Array.isArray(response?.data?.detail)) {
          setErrorApi(response.data.detail.map((d) => d.msg).join(', '));
        } else {
          setErrorApi('Ocurrió un error al guardar el vehículo. Intente nuevamente.');
        }
      } else {
        setErrorApi('No fue posible conectar con el servidor. Verifique su conexión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-100 p-6 space-y-6 relative overflow-hidden">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Registrar vehículo</h2>
            <p className="text-sm text-gray-500 mt-1">
              Ingresa los datos para monitorear el Pico y Placa de tu vehículo
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            type="button"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Alerta de Error de API */}
        {errorApi && (
          <div id="alerta-error-vehiculo" className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-2">
            <span className="text-red-500 font-bold">⚠️</span>
            <span>{errorApi}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo: Placa */}
          <div>
            <label htmlFor="input-placa" className="block text-sm font-semibold text-gray-700 mb-1">
              Placa del vehículo <span className="text-red-500">*</span>
            </label>
            <input
              id="input-placa"
              type="text"
              value={placaInput}
              onChange={handlePlacaChange}
              onBlur={() => setTouchedPlaca(true)}
              placeholder="Ej. ABC123 o ABC12D"
              maxLength={7}
              required
              className={`input-base font-mono uppercase tracking-wider text-lg ${
                mostrarErrorPlaca ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {mostrarErrorPlaca ? (
              <p id="error-placa-formato" className="text-xs text-red-600 font-medium mt-1">
                ⚠️ {PLACA_MENSAJE_ERROR}
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                Formatos válidos colombianos: 3 letras y 3 números (ABC123) o 3 letras, 2 números y 1 letra (ABC12D).
              </p>
            )}
          </div>

          {/* Campo: Tipo de vehículo */}
          <div>
            <label htmlFor="select-tipo" className="block text-sm font-semibold text-gray-700 mb-1">
              Tipo de vehículo <span className="text-red-500">*</span>
            </label>
            <select
              id="select-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoVehiculo)}
              className="input-base"
            >
              {TIPOS_VEHICULO.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.icon} {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Campo: Alias opcional */}
          <div>
            <label htmlFor="input-alias" className="block text-sm font-semibold text-gray-700 mb-1">
              Alias / Nombre amigable <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            <input
              id="input-alias"
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej. Mi carro, Vehículo del trabajo"
              maxLength={50}
              className="input-base"
            />
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-guardar-vehiculo"
              type="submit"
              disabled={loading || (touchedPlaca && !esPlacaValida)}
              className="btn-primary"
            >
              {loading ? 'Guardando...' : 'Guardar vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

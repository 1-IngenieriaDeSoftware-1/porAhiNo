'use client';

import React, { useState, useEffect } from 'react';
import adminService, { type DecretoCreate, type DecretoUpdate } from '@/services/adminService';
import type { DecretoAPI, MunicipioAPI } from '@/types/api';
import { useToast } from '@/providers/ToastProvider';
import { apiErrorMessage } from '@/lib/utils';

interface DecretoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (decreto: DecretoAPI, isEdit: boolean) => void;
  decretoAEditar?: DecretoAPI | null;
  municipios: MunicipioAPI[];
}

const DIAS_SEMANA = [
  { val: 0, label: 'Lun' },
  { val: 1, label: 'Mar' },
  { val: 2, label: 'Mié' },
  { val: 3, label: 'Jue' },
  { val: 4, label: 'Vie' },
  { val: 5, label: 'Sáb' },
  { val: 6, label: 'Dom' },
];

export default function DecretoFormModal({
  isOpen,
  onClose,
  onSuccess,
  decretoAEditar,
  municipios,
}: DecretoFormModalProps) {
  const { error: toastError, success } = useToast();
  const [municipioId, setMunicipioId] = useState<number>(municipios[0]?.id || 1);
  const [numeroDecreto, setNumeroDecreto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [horaInicio, setHoraInicio] = useState('06:00');
  const [horaFin, setHoraFin] = useState('20:00');
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([0, 1, 2, 3, 4]);
  const [digitosRestringidos, setDigitosRestringidos] = useState('1, 2');
  const [vigenciaDesde, setVigenciaDesde] = useState('');
  const [vigenciaHasta, setVigenciaHasta] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (decretoAEditar) {
      setMunicipioId(decretoAEditar.municipio_id);
      setNumeroDecreto(decretoAEditar.numero_decreto || '');
      setDescripcion(decretoAEditar.descripcion || '');
      setHoraInicio(decretoAEditar.hora_inicio.slice(0, 5));
      setHoraFin(decretoAEditar.hora_fin.slice(0, 5));
      
      const dias = decretoAEditar.dias_restriccion
        .split(',')
        .map((d) => parseInt(d.trim(), 10))
        .filter((d) => !isNaN(d));
      setDiasSeleccionados(dias);
      
      setDigitosRestringidos(decretoAEditar.digitos_restringidos);
      setVigenciaDesde(decretoAEditar.vigencia_desde);
      setVigenciaHasta(decretoAEditar.vigencia_hasta || '');
      setIsActive(decretoAEditar.is_active);
    } else {
      setMunicipioId(municipios[0]?.id || 1);
      setNumeroDecreto('');
      setDescripcion('');
      setHoraInicio('06:00');
      setHoraFin('20:00');
      setDiasSeleccionados([0, 1, 2, 3, 4]);
      setDigitosRestringidos('1, 2');
      const hoy = new Date().toISOString().split('T')[0];
      setVigenciaDesde(hoy);
      setVigenciaHasta('');
      setIsActive(true);
    }
  }, [decretoAEditar, municipios, isOpen]);

  if (!isOpen) return null;

  const toggleDia = (dia: number) => {
    if (diasSeleccionados.includes(dia)) {
      setDiasSeleccionados(diasSeleccionados.filter((d) => d !== dia));
    } else {
      setDiasSeleccionados([...diasSeleccionados, dia].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (horaInicio >= horaFin) {
      toastError('La hora de inicio debe ser anterior a la hora de fin.');
      return;
    }

    if (diasSeleccionados.length === 0) {
      toastError('Debes seleccionar al menos un día de restricción.');
      return;
    }

    if (!digitosRestringidos.trim()) {
      toastError('Debes ingresar al menos un dígito restringido.');
      return;
    }

    if (vigenciaHasta && vigenciaHasta < vigenciaDesde) {
      toastError('La fecha de vigencia hasta no puede ser anterior a vigencia desde.');
      return;
    }

    setLoading(true);

    try {
      const diasStr = diasSeleccionados.join(',');
      const digitosLimpios = digitosRestringidos
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean)
        .join(',');

      if (decretoAEditar) {
        const payload: DecretoUpdate = {
          descripcion: descripcion.trim() || undefined,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          dias_restriccion: diasStr,
          digitos_restringidos: digitosLimpios,
          vigencia_hasta: vigenciaHasta || undefined,
          is_active: isActive,
        };

        const actualizado = await adminService.actualizarDecreto(decretoAEditar.id, payload);
        onSuccess(actualizado, true);
        success('Decreto actualizado');
      } else {
        const payload: DecretoCreate = {
          municipio_id: municipioId,
          numero_decreto: numeroDecreto.trim() || undefined,
          descripcion: descripcion.trim() || undefined,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          dias_restriccion: diasStr,
          digitos_restringidos: digitosLimpios,
          vigencia_desde: vigenciaDesde,
          vigencia_hasta: vigenciaHasta || undefined,
        };

        const creado = await adminService.crearDecreto(payload);
        onSuccess(creado, false);
        success('Decreto creado');
      }
      onClose();
    } catch (err: unknown) {
      toastError(apiErrorMessage(err, 'Error al guardar el decreto.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-gray-100 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {decretoAEditar ? 'Editar Decreto de Pico y Placa' : 'Crear Nuevo Decreto'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Configura los horarios, días y dígitos aplicables
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Municipio */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Municipio <span className="text-red-500">*</span>
            </label>
            <select
              value={municipioId}
              onChange={(e) => setMunicipioId(Number(e.target.value))}
              disabled={!!decretoAEditar}
              className="input-base"
            >
              {municipios.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} ({m.departamento})
                </option>
              ))}
            </select>
          </div>

          {/* Número de Decreto y Descripción */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Número de decreto
              </label>
              <input
                type="text"
                value={numeroDecreto}
                onChange={(e) => setNumeroDecreto(e.target.value)}
                placeholder="Ej. Decreto 084 de 2026"
                disabled={!!decretoAEditar}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. Particulares horario extendido"
                className="input-base"
              />
            </div>
          </div>

          {/* Horario de Restricción */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Hora de inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                required
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Hora de fin <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                required
                className="input-base"
              />
            </div>
          </div>

          {/* Días de Restricción */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Días de la semana <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map((dia) => {
                const activo = diasSeleccionados.includes(dia.val);
                return (
                  <button
                    key={dia.val}
                    type="button"
                    onClick={() => toggleDia(dia.val)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      activo
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {dia.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dígitos Restringidos */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Dígitos restringidos (separados por coma) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={digitosRestringidos}
              onChange={(e) => setDigitosRestringidos(e.target.value)}
              placeholder="Ej. 1, 2"
              required
              className="input-base font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">
              Último dígito de la placa alcanzado por la restricción.
            </p>
          </div>

          {/* Vigencia */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Vigencia desde <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={vigenciaDesde}
                onChange={(e) => setVigenciaDesde(e.target.value)}
                required
                disabled={!!decretoAEditar}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Vigencia hasta (opcional)
              </label>
              <input
                type="date"
                value={vigenciaHasta}
                onChange={(e) => setVigenciaHasta(e.target.value)}
                className="input-base"
              />
            </div>
          </div>

          {/* Estado activo (si es edición) */}
          {decretoAEditar && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is-active-check"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <label htmlFor="is-active-check" className="text-sm font-medium text-gray-700">
                Decreto activo (aplica para consultas ciudadanas)
              </label>
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary py-2 px-5 text-sm"
            >
              {loading ? 'Guardando...' : decretoAEditar ? 'Guardar cambios' : 'Crear decreto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

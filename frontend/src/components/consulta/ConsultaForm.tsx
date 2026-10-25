'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatPlaca, validarPlaca, PLACA_MENSAJE_ERROR } from '@/lib/placa';
import { useAuth } from '@/providers/AuthProvider';
import consultaService from '@/services/consultaService';
import vehiculosService from '@/services/vehiculosService';
import type { ConsultaRequestAPI, MunicipioAPI, VehiculoAPI } from '@/types/api';

interface ConsultaFormProps {
  onSubmit: (payload: ConsultaRequestAPI) => Promise<void>;
  loading?: boolean;
  municipioSeleccionadoId?: string;
  onAbrirMapa?: () => void;
}

export default function ConsultaForm({
  onSubmit,
  loading = false,
  municipioSeleccionadoId,
  onAbrirMapa,
}: ConsultaFormProps) {
  const { user, isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const [placa, setPlaca] = useState('');
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState('');
  const [municipioId, setMunicipioId] = useState(municipioSeleccionadoId || '');
  const [municipios, setMunicipios] = useState<MunicipioAPI[]>([]);
  const [vehiculos, setVehiculos] = useState<VehiculoAPI[]>([]);
  const [cargaMunicipios, setCargaMunicipios] = useState(true);
  const [cargaVehiculos, setCargaVehiculos] = useState(false);
  const [errorPlaca, setErrorPlaca] = useState<string | undefined>();
  const [errorMunicipio, setErrorMunicipio] = useState<string | undefined>();
  const [avisoMunicipios, setAvisoMunicipios] = useState<string | null>(null);

  useEffect(() => {
    if (municipioSeleccionadoId) {
      setMunicipioId(municipioSeleccionadoId);
    }
  }, [municipioSeleccionadoId]);

  useEffect(() => {
    const placaUrl = searchParams.get('placa');
    if (placaUrl) {
      setPlaca(formatPlaca(placaUrl));
    }
    const munUrl = searchParams.get('municipio_id');
    if (munUrl) {
      setMunicipioId(munUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancel = false;
    consultaService
      .getMunicipios()
      .then((data) => {
        if (cancel) return;
        setMunicipios(data);
        setAvisoMunicipios(
          data.length === 0
            ? 'No hay municipios con decreto activo por ahora.'
            : null,
        );
      })
      .catch(() => {
        if (!cancel) {
          setMunicipios([]);
          setAvisoMunicipios('No se pudieron cargar los municipios. Intenta de nuevo más tarde.');
        }
      })
      .finally(() => {
        if (!cancel) setCargaMunicipios(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!user || isAdmin) {
      setVehiculos([]);
      return;
    }
    let cancel = false;
    setCargaVehiculos(true);
    vehiculosService
      .listarVehiculos()
      .then((data) => {
        if (!cancel) setVehiculos(data);
      })
      .catch(() => {
        if (!cancel) setVehiculos([]);
      })
      .finally(() => {
        if (!cancel) setCargaVehiculos(false);
      });
    return () => {
      cancel = true;
    };
  }, [user, isAdmin]);

  useEffect(() => {
    if (!placa || vehiculos.length === 0) return;
    const match = vehiculos.find((v) => v.placa === placa);
    if (match) setVehiculoSeleccionado(String(match.id));
  }, [placa, vehiculos]);

  const handleSeleccionarVehiculo = (id: string) => {
    setVehiculoSeleccionado(id);
    if (!id) return;
    const elegido = vehiculos.find((v) => String(v.id) === id);
    if (elegido) {
      setPlaca(elegido.placa);
      setErrorPlaca(undefined);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const placaNorm = formatPlaca(placa);
    let valido = true;

    if (!validarPlaca(placaNorm)) {
      setErrorPlaca(PLACA_MENSAJE_ERROR);
      valido = false;
    } else {
      setErrorPlaca(undefined);
    }

    if (!municipioId) {
      setErrorMunicipio('Selecciona un municipio');
      valido = false;
    } else {
      setErrorMunicipio(undefined);
    }

    if (!valido) return;

    await onSubmit({ placa: placaNorm, municipio_id: Number(municipioId) });
  };

  const mostrarSelectorVehiculos = Boolean(user && !isAdmin);

  return (
    <form onSubmit={handleSubmit} className="space-y-4" id="form-consulta" noValidate>
      {mostrarSelectorVehiculos && (
        <div className="space-y-1">
          <label htmlFor="select-vehiculo" className="block text-sm font-medium text-gray-700">
            Mis vehículos
          </label>
          <select
            id="select-vehiculo"
            className="input-base"
            value={vehiculoSeleccionado}
            onChange={(e) => handleSeleccionarVehiculo(e.target.value)}
            disabled={cargaVehiculos || vehiculos.length === 0}
          >
            <option value="">
              {cargaVehiculos
                ? 'Cargando vehículos...'
                : vehiculos.length === 0
                  ? 'No tienes vehículos guardados'
                  : 'Elegir placa guardada'}
            </option>
            {vehiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.placa}
                {v.alias ? ` — ${v.alias}` : ''} ({v.tipo})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400">
            Elige un vehículo guardado para prellenar la placa, o escríbela a mano.
          </p>
        </div>
      )}

      <Input
        id="input-placa"
        label="Placa del vehículo"
        placeholder="ABC123"
        maxLength={6}
        value={placa}
        onChange={(e) => {
          const next = formatPlaca(e.target.value);
          setPlaca(next);
          const match = vehiculos.find((v) => v.placa === next);
          setVehiculoSeleccionado(match ? String(match.id) : '');
          if (errorPlaca) setErrorPlaca(undefined);
        }}
        error={errorPlaca}
        helperText="Formato colombiano: ABC123 o ABC12D"
        autoComplete="off"
      />

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label htmlFor="select-municipio" className="block text-sm font-medium text-gray-700">
            Municipio
          </label>
          {onAbrirMapa && (
            <button
              type="button"
              id="btn-abrir-mapa-form"
              onClick={onAbrirMapa}
              className="text-xs font-semibold text-primary-700 hover:text-primary-900 flex items-center gap-1 hover:underline transition-colors"
            >
              <span>🗺️</span>
              <span>Ver en mapa</span>
            </button>
          )}
        </div>
        <select
          id="select-municipio"
          className="input-base"
          value={municipioId}
          onChange={(e) => {
            setMunicipioId(e.target.value);
            setErrorMunicipio(undefined);
          }}
          disabled={cargaMunicipios || municipios.length === 0}
        >
          <option value="">
            {cargaMunicipios ? 'Cargando municipios...' : 'Selecciona un municipio'}
          </option>
          {municipios.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre} ({m.departamento})
            </option>
          ))}
        </select>
        {errorMunicipio && <p className="text-sm text-red-600">{errorMunicipio}</p>}
        {avisoMunicipios && <p className="text-sm text-gray-400">{avisoMunicipios}</p>}
      </div>

      <Button type="submit" id="btn-submit-consulta" className="w-full" loading={loading}>
        Verificar estado
      </Button>
    </form>
  );
}

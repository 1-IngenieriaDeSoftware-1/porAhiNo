'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatPlaca, validarPlaca, PLACA_MENSAJE_ERROR } from '@/lib/placa';
import consultaService from '@/services/consultaService';
import type { ConsultaRequestAPI, MunicipioAPI } from '@/types/api';

interface ConsultaFormProps {
  onSubmit: (payload: ConsultaRequestAPI) => Promise<void>;
  loading?: boolean;
}

export default function ConsultaForm({ onSubmit, loading = false }: ConsultaFormProps) {
  const [placa, setPlaca] = useState('');
  const [municipioId, setMunicipioId] = useState('');
  const [municipios, setMunicipios] = useState<MunicipioAPI[]>([]);
  const [cargaMunicipios, setCargaMunicipios] = useState(true);
  const [errorPlaca, setErrorPlaca] = useState<string | undefined>();
  const [errorMunicipio, setErrorMunicipio] = useState<string | undefined>();
  const [avisoMunicipios, setAvisoMunicipios] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    consultaService
      .getMunicipios()
      .then((data) => {
        if (!cancel) setMunicipios(data);
      })
      .catch((err: { response?: { status?: number } }) => {
        if (!cancel) {
          setMunicipios([]);
          setAvisoMunicipios(
            err.response?.status === 501
              ? 'El listado de municipios se habilitará con US-003. Mientras tanto puedes dejar el cascarón listo.'
              : 'No se pudieron cargar los municipios.',
          );
        }
      })
      .finally(() => {
        if (!cancel) setCargaMunicipios(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4" id="form-consulta" noValidate>
      <Input
        id="input-placa"
        label="Placa del vehículo"
        placeholder="ABC123"
        maxLength={6}
        value={placa}
        onChange={(e) => {
          setPlaca(formatPlaca(e.target.value));
          if (errorPlaca) setErrorPlaca(undefined);
        }}
        error={errorPlaca}
        helperText="Formato colombiano: ABC123 o ABC12D"
        autoComplete="off"
      />

      <div className="space-y-1">
        <label htmlFor="select-municipio" className="block text-sm font-medium text-gray-700">
          Municipio
        </label>
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

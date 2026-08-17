/**
 * Componente: ConsultaForm
 *
 * Formulario principal de consulta de Pico y Placa.
 * Campos: placa, municipio, fecha/hora opcional.
 *
 * TODO:
 *   - Cargar municipios desde API (/api/v1/consulta/municipios)
 *   - Llamar a consultaService.verificarRestriccion()
 *   - Mostrar <ResultadoConsulta /> con la respuesta
 *   - Validación de placa colombiana en tiempo real
 */

'use client';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ConsultaForm() {
  // TODO: Estado con useState
  // TODO: Integrar con consultaService

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Llamar a consultaService.verificarRestriccion()
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" id="form-consulta">
      <Input
        id="input-placa"
        label="Placa del vehículo"
        placeholder="ABC123"
        maxLength={6}
        helperText="Formato: 3 letras + 3 caracteres (ej: ABC123)"
      />

      <div className="space-y-1">
        <label htmlFor="select-municipio" className="block text-sm font-medium text-gray-700">
          Municipio
        </label>
        <select id="select-municipio" className="input-base">
          <option value="">Cargando municipios...</option>
          {/* TODO: Renderizar municipios desde API */}
        </select>
      </div>

      <Button type="submit" id="btn-submit-consulta" className="w-full">
        Consultar restricción
      </Button>
    </form>
  );
}

/**
 * Servicio Frontend: Consulta de Pico y Placa
 *
 * Capa de abstracción entre componentes React y la API REST del backend.
 * Los componentes llaman a estos métodos, nunca a axios/fetch directamente.
 *
 * Endpoints que consume:
 *   POST /api/v1/consulta/          → verificarRestriccion
 *   GET  /api/v1/consulta/municipios → getMunicipios
 */

import apiClient from './apiClient';

// --- Tipos (TODO: mover a types/api.ts cuando estén definidos) ---
export interface ConsultaRequest {
  placa: string;
  municipio_id: number;
  fecha_hora?: string; // ISO 8601
}

export interface ConsultaResponse {
  placa: string;
  municipio: string;
  fecha_hora_consultada: string;
  tiene_restriccion: boolean;
  detalle?: {
    decreto_id: number;
    hora_inicio: string;
    hora_fin: string;
    dias_restriccion: number[];
    digitos_restringidos: string[];
  };
  mensaje: string;
}

export interface Municipio {
  id: number;
  nombre: string;
  departamento: string;
}


const consultaService = {
  /**
   * Verifica si una placa tiene restricción de Pico y Placa.
   * Corresponde a POST /api/v1/consulta/
   */
  async verificarRestriccion(payload: ConsultaRequest): Promise<ConsultaResponse> {
    const { data } = await apiClient.post<ConsultaResponse>('/consulta/', payload);
    return data;
  },

  /**
   * Obtiene la lista de municipios con decretos activos.
   * Corresponde a GET /api/v1/consulta/municipios
   */
  async getMunicipios(): Promise<Municipio[]> {
    const { data } = await apiClient.get<Municipio[]>('/consulta/municipios');
    return data;
  },
};

export default consultaService;

/**
 * Servicio Frontend: Administración (US-004)
 *
 * Endpoints que consume (todos protegidos, solo admins):
 *   GET    /api/v1/admin/decretos       → listarDecretos
 *   POST   /api/v1/admin/decretos       → crearDecreto
 *   PUT    /api/v1/admin/decretos/{id}  → actualizarDecreto
 *   DELETE /api/v1/admin/decretos/{id}  → eliminarDecreto
 *   GET    /api/v1/admin/municipios     → listarMunicipios
 *   POST   /api/v1/admin/municipios     → crearMunicipio
 */

import apiClient from './apiClient';

export interface Decreto {
  id: number;
  municipio_id: number;
  numero_decreto?: string;
  descripcion?: string;
  hora_inicio: string;
  hora_fin: string;
  dias_restriccion: string;
  digitos_restringidos: string;
  vigencia_desde: string;
  vigencia_hasta?: string;
  is_active: boolean;
}

export interface DecretoCreate {
  municipio_id: number;
  numero_decreto?: string;
  descripcion?: string;
  hora_inicio: string;
  hora_fin: string;
  dias_restriccion: string;
  digitos_restringidos: string;
  vigencia_desde: string;
  vigencia_hasta?: string;
}


const adminService = {
  async listarDecretos(): Promise<Decreto[]> {
    const { data } = await apiClient.get<Decreto[]>('/admin/decretos');
    return data;
  },

  async crearDecreto(payload: DecretoCreate): Promise<Decreto> {
    const { data } = await apiClient.post<Decreto>('/admin/decretos', payload);
    return data;
  },

  async actualizarDecreto(id: number, payload: Partial<DecretoCreate>): Promise<Decreto> {
    const { data } = await apiClient.put<Decreto>(`/admin/decretos/${id}`, payload);
    return data;
  },

  async eliminarDecreto(id: number): Promise<void> {
    await apiClient.delete(`/admin/decretos/${id}`);
  },
};

export default adminService;

import apiClient from './apiClient';
import type { DecretoAPI, MunicipioAPI } from '@/types/api';

export type DecretoCreate = Omit<DecretoAPI, 'id' | 'is_active'>;
export type DecretoUpdate = Partial<DecretoCreate> & { is_active?: boolean };

const adminService = {
  async listarDecretos(): Promise<DecretoAPI[]> {
    const { data } = await apiClient.get<DecretoAPI[]>('/admin/decretos');
    return data;
  },

  async crearDecreto(payload: DecretoCreate): Promise<DecretoAPI> {
    const { data } = await apiClient.post<DecretoAPI>('/admin/decretos', payload);
    return data;
  },

  async actualizarDecreto(id: number, payload: DecretoUpdate): Promise<DecretoAPI> {
    const { data } = await apiClient.put<DecretoAPI>(`/admin/decretos/${id}`, payload);
    return data;
  },

  async eliminarDecreto(id: number): Promise<void> {
    await apiClient.delete(`/admin/decretos/${id}`);
  },

  async listarMunicipios(): Promise<MunicipioAPI[]> {
    const { data } = await apiClient.get<MunicipioAPI[]>('/admin/municipios');
    return data;
  },
};

export default adminService;

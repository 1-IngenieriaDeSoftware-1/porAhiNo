import apiClient from './apiClient';
import type { VehiculoAPI } from '@/types/api';

export type VehiculoCreate = Pick<VehiculoAPI, 'placa' | 'tipo'> & { alias?: string };
export type VehiculoUpdate = Partial<Pick<VehiculoAPI, 'alias' | 'tipo'>>;

const vehiculosService = {
  async listarVehiculos(): Promise<VehiculoAPI[]> {
    const { data } = await apiClient.get<VehiculoAPI[]>('/vehiculos/');
    return data;
  },

  async crearVehiculo(payload: VehiculoCreate): Promise<VehiculoAPI> {
    const { data } = await apiClient.post<VehiculoAPI>('/vehiculos/', payload);
    return data;
  },

  async actualizarVehiculo(id: number, payload: VehiculoUpdate): Promise<VehiculoAPI> {
    const { data } = await apiClient.put<VehiculoAPI>(`/vehiculos/${id}`, payload);
    return data;
  },

  async eliminarVehiculo(id: number): Promise<void> {
    await apiClient.delete(`/vehiculos/${id}`);
  },
};

export default vehiculosService;

/**
 * Servicio Frontend: Gestión de Vehículos (US-001, US-006)
 *
 * Endpoints que consume:
 *   GET    /api/v1/vehiculos         → listarVehiculos
 *   POST   /api/v1/vehiculos         → crearVehiculo
 *   PUT    /api/v1/vehiculos/{id}    → actualizarVehiculo
 *   DELETE /api/v1/vehiculos/{id}    → eliminarVehiculo
 */

import apiClient from './apiClient';

export interface Vehiculo {
  id: number;
  placa: string;
  tipo: 'particular' | 'taxi' | 'moto' | 'carga' | 'publico';
  alias?: string;
  id_usuario: number;
  created_at: string;
}

export interface VehiculoCreate {
  placa: string;
  tipo: Vehiculo['tipo'];
  alias?: string;
}

export interface VehiculoUpdate {
  alias?: string;
  tipo?: Vehiculo['tipo'];
}


const vehiculosService = {
  async listarVehiculos(): Promise<Vehiculo[]> {
    const { data } = await apiClient.get<Vehiculo[]>('/vehiculos/');
    return data;
  },

  async crearVehiculo(payload: VehiculoCreate): Promise<Vehiculo> {
    const { data } = await apiClient.post<Vehiculo>('/vehiculos/', payload);
    return data;
  },

  async actualizarVehiculo(id: number, payload: VehiculoUpdate): Promise<Vehiculo> {
    const { data } = await apiClient.put<Vehiculo>(`/vehiculos/${id}`, payload);
    return data;
  },

  async eliminarVehiculo(id: number): Promise<void> {
    await apiClient.delete(`/vehiculos/${id}`);
  },
};

export default vehiculosService;

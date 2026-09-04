import apiClient from './apiClient';
import type {
  ConsultaRequestAPI,
  ConsultaResponseAPI,
  MunicipioAPI,
} from '@/types/api';

const consultaService = {
  async verificarRestriccion(payload: ConsultaRequestAPI): Promise<ConsultaResponseAPI> {
    const { data } = await apiClient.post<ConsultaResponseAPI>('/consulta/', payload);
    return data;
  },

  async getMunicipios(): Promise<MunicipioAPI[]> {
    const { data } = await apiClient.get<MunicipioAPI[]>('/consulta/municipios');
    return data;
  },
};

export default consultaService;

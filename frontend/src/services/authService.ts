import apiClient from './apiClient';
import type { LoginRequestAPI, TokenResponseAPI, UsuarioAPI } from '@/types/api';

const authService = {
  async login(payload: LoginRequestAPI): Promise<TokenResponseAPI> {
    const { data } = await apiClient.post<TokenResponseAPI>('/auth/login', payload);
    return data;
  },

  async registro(email: string, password: string): Promise<UsuarioAPI> {
    const { data } = await apiClient.post<UsuarioAPI>('/auth/register', { email, password });
    return data;
  },

  async getMe(): Promise<UsuarioAPI> {
    const { data } = await apiClient.get<UsuarioAPI>('/auth/me');
    return data;
  },

  logout(): void {
    /* El token se limpia en AuthProvider */
  },
};

export default authService;

/**
 * Servicio Frontend: Autenticación
 *
 * Endpoints que consume:
 *   POST /api/v1/auth/register → registro
 *   POST /api/v1/auth/login    → login
 *   GET  /api/v1/auth/me       → getMe
 *
 * TODO: Implementar almacenamiento seguro del JWT
 * (HttpOnly cookie es más seguro que localStorage)
 */

import apiClient from './apiClient';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface UsuarioResponse {
  id: number;
  email: string;
  rol: 'conductor' | 'admin';
  is_active: boolean;
  created_at: string;
}


const authService = {
  async login(payload: LoginRequest): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>('/auth/login', payload);
    // TODO: Guardar token de forma segura
    return data;
  },

  async registro(email: string, password: string): Promise<UsuarioResponse> {
    const { data } = await apiClient.post<UsuarioResponse>('/auth/register', { email, password });
    return data;
  },

  async getMe(): Promise<UsuarioResponse> {
    const { data } = await apiClient.get<UsuarioResponse>('/auth/me');
    return data;
  },

  logout(): void {
    // TODO: Limpiar token del almacenamiento
    // localStorage.removeItem('access_token');
  },
};

export default authService;

/**
 * API Client — Axios configurado para consumir el backend FastAPI.
 *
 * Toda la comunicación frontend ↔ backend pasa por este cliente.
 * El frontend NUNCA se conecta directamente a PostgreSQL.
 *
 * Base URL: NEXT_PUBLIC_API_URL (variable de entorno)
 * Autenticación: Bearer JWT en header Authorization
 */

import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Interceptor de request: agrega JWT si existe ---
apiClient.interceptors.request.use((config) => {
  // TODO: Obtener token desde localStorage o cookie segura
  // const token = localStorage.getItem('access_token');
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Interceptor de response: manejo global de errores ---
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // TODO: Redirigir al login si el token expiró
      // window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

/**
 * Cliente HTTP único hacia FastAPI.
 * El frontend nunca habla con PostgreSQL.
 */

import axios from 'axios';
import { TOKEN_STORAGE_KEY } from '@/lib/routes';

function resolveApiBaseUrl(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  // 10.0.2.2 solo sirve en emulador Android; en navegador del host falla.
  const isBrowser = typeof window !== 'undefined';
  const isNative =
    isBrowser &&
    Boolean(
      (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
        ?.isNativePlatform?.(),
    );
  if (fromEnv.includes('10.0.2.2') && isBrowser && !isNative) {
    return 'http://localhost:8000/api/v1';
  }
  if (fromEnv) return fromEnv;
  if (isNative) return 'http://10.0.2.2:8000/api/v1';
  return 'http://localhost:8000/api/v1';
}

/** Timeout global (ms). Configurable con NEXT_PUBLIC_API_TIMEOUT_MS. */
export const API_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 60000);

/**
 * Timeout (ms) para recálculos en ruta (POST /rutas/ durante la navegación).
 * Más corto que el global: si Valhalla tarda, mejor reintentar tras el cooldown.
 * Configurable con NEXT_PUBLIC_RECALC_TIMEOUT_MS.
 */
export const RECALC_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_RECALC_TIMEOUT_MS || 10000);

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  // Cálculo inicial con desvíos por corredor puede ser lento en red pública
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// En el cliente, reajusta por si el bundle nació con env de Android
if (typeof window !== 'undefined') {
  apiClient.defaults.baseURL = resolveApiBaseUrl();
}

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    return Promise.reject(error);
  },
);

export default apiClient;

import axios from 'axios';
import apiClient, { RECALC_TIMEOUT_MS } from './apiClient';

export interface RutaRequest {
  origen_lat: number;
  origen_lon: number;
  destino_lat: number;
  destino_lon: number;
  municipio_id: number;
  placa?: string;
  fecha_hora?: string;
  /** ISO 8601: hora de salida para evaluar Pico y Placa al llegar a la zona. */
  hora_salida?: string;
  /** Rumbo actual en grados [0,360) para recálculo. */
  heading?: number;
}

export interface RutaOpcion {
  tipo: string;
  viable: boolean;
  distancia_m: number;
  duracion_s: number;
  duracion_min: number;
  mensaje: string;
  geometria: { type: string; coordinates: number[][] };
  evita_restriccion: boolean;
  provider?: string | null;
}

export interface RutaResponse {
  municipio: string;
  placa: string | null;
  restringido: boolean;
  mensaje_restriccion: string;
  diferencia_min: number | null;
  rutas: RutaOpcion[];
  hora_salida?: string | null;
  /** ISO 8601: ETA estimada de entrada a la zona. */
  eta_entrada_zona?: string | null;
  /** Si la restricción aplica a la hora estimada de llegada a la zona. */
  restriccion_en_eta?: boolean | null;
}

export interface MatchPoint {
  lat: number;
  lon: number;
}

export interface MatchResponse {
  viable: boolean;
  mensaje: string;
  provider: string;
  matched: MatchPoint[];
  geometria: { type: string; coordinates: number[][] };
}

export interface SemaforoAPI {
  id: number;
  municipio_id: number | null;
  lat: number;
  lon: number;
  nombre?: string | null;
  osm_id?: number | null;
}

export interface RequestOptions {
  signal?: AbortSignal;
  /** Timeout en ms; sobreescribe el global de apiClient. */
  timeout?: number;
}

/** true si el error proviene de una cancelación (AbortController) y no debe mostrarse. */
export function isAbortError(err: unknown): boolean {
  if (axios.isCancel(err)) return true;
  const e = err as { name?: string; code?: string } | null;
  return e?.name === 'AbortError' || e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED';
}

export interface ZonaAPI {
  id: number;
  municipio_id: number;
  municipio: string;
  nombre: string;
  geometria: number[][];
  descripcion?: string;
}

export interface CamaraAPI {
  id: number;
  municipio_id: number | null;
  municipio: string | null;
  nombre: string;
  lat: number;
  lon: number;
  tipo: string;
  fuente?: string;
}

export interface GeocodeHit {
  display_name: string;
  lat: number;
  lon: number;
}

export const rutasService = {
  /** Cálculo inicial de ruta (timeout 20s por defecto; admite heading, hora_salida y AbortSignal). */
  async calcularRuta(payload: RutaRequest, opts: RequestOptions = {}): Promise<RutaResponse> {
    const { data } = await apiClient.post<RutaResponse>('/rutas/', payload, {
      timeout: opts.timeout ?? 20000,
      signal: opts.signal,
    });
    return data;
  },
  /** Recálculo en ruta: timeout corto (RECALC_TIMEOUT_MS ≈ 10s, configurable). */
  async recalcularRuta(payload: RutaRequest, signal?: AbortSignal): Promise<RutaResponse> {
    return rutasService.calcularRuta(payload, { signal, timeout: RECALC_TIMEOUT_MS });
  },
  /** @deprecated usar calcularRuta */
  async calcular(payload: RutaRequest, opts: RequestOptions = {}): Promise<RutaResponse> {
    return rutasService.calcularRuta(payload, opts);
  },
  /** Map matching de una traza GPS: POST /rutas/match. */
  async matchTrace(
    points: MatchPoint[],
    municipioId?: number,
    opts: RequestOptions = {},
  ): Promise<MatchResponse> {
    const { data } = await apiClient.post<MatchResponse>(
      '/rutas/match',
      { points, municipio_id: municipioId },
      { timeout: opts.timeout ?? RECALC_TIMEOUT_MS, signal: opts.signal },
    );
    return data;
  },
  async listSemaforos(municipioId?: number, opts: RequestOptions = {}): Promise<SemaforoAPI[]> {
    const { data } = await apiClient.get<SemaforoAPI[]>('/rutas/semaforos', {
      params: municipioId ? { municipio_id: municipioId } : undefined,
      signal: opts.signal,
      timeout: opts.timeout,
    });
    return data;
  },
  async zonas(municipioId?: number): Promise<ZonaAPI[]> {
    const { data } = await apiClient.get<ZonaAPI[]>('/rutas/zonas', {
      params: municipioId ? { municipio_id: municipioId } : undefined,
    });
    return data;
  },
  async camaras(municipioId?: number): Promise<CamaraAPI[]> {
    const { data } = await apiClient.get<CamaraAPI[]>('/rutas/camaras', {
      params: municipioId ? { municipio_id: municipioId } : undefined,
    });
    return data;
  },
  async geocodificar(q: string): Promise<GeocodeHit[]> {
    const { data } = await apiClient.get<GeocodeHit[]>('/rutas/geocodificar', {
      params: { q },
      timeout: 15000,
    });
    return data;
  },
  async vapidPublicKey(): Promise<{ publicKey: string; configured: boolean }> {
    const { data } = await apiClient.get<{ publicKey: string; configured: boolean }>(
      '/push/vapid-public-key',
    );
    return data;
  },
  async subscribePush(body: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    user_agent?: string;
  }): Promise<void> {
    await apiClient.post('/push/subscribe', body);
  },
};

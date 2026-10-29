import apiClient from './apiClient';

export interface RutaRequest {
  origen_lat: number;
  origen_lon: number;
  destino_lat: number;
  destino_lon: number;
  municipio_id: number;
  placa?: string;
  fecha_hora?: string;
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
}

export interface RutaResponse {
  municipio: string;
  placa: string | null;
  restringido: boolean;
  mensaje_restriccion: string;
  diferencia_min: number | null;
  rutas: RutaOpcion[];
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
  async calcular(payload: RutaRequest): Promise<RutaResponse> {
    const { data } = await apiClient.post<RutaResponse>('/rutas/', payload, { timeout: 20000 });
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

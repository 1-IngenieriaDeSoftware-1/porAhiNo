/**
 * Tipos TypeScript compartidos — contratos de la API REST
 *
 * Reflejan los schemas Pydantic del backend.
 * Actualizar cuando cambien los schemas del backend.
 *
 * TODO: Considerar generar automáticamente desde OpenAPI spec del backend
 *       usando openapi-typescript: npx openapi-typescript http://localhost:8000/openapi.json
 */

// --- Generales ---
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

// --- Municipio ---
export interface MunicipioAPI {
  id: number;
  nombre: string;
  departamento: string;
  codigo_dane?: string;
}

// --- Usuario ---
export type RolUsuario = 'conductor' | 'admin';

export interface UsuarioAPI {
  id: number;
  email: string;
  rol: RolUsuario;
  is_active: boolean;
  created_at: string;
}

// --- Vehículo ---
export type TipoVehiculo = 'particular' | 'taxi' | 'moto' | 'carga' | 'publico';

export interface VehiculoAPI {
  id: number;
  placa: string;
  tipo: TipoVehiculo;
  alias?: string;
  id_usuario: number;
  created_at: string;
}

// --- Consulta ---
export interface ConsultaRequestAPI {
  placa: string;
  municipio_id: number;
  fecha_hora?: string;
}

export interface ConsultaResponseAPI {
  placa: string;
  municipio: string;
  fecha_hora_consultada: string;
  tiene_restriccion: boolean;
  detalle?: RestriccionDetalleAPI;
  mensaje: string;
}

export interface RestriccionDetalleAPI {
  decreto_id: number;
  hora_inicio: string;
  hora_fin: string;
  dias_restriccion: number[];
  digitos_restringidos: string[];
  descripcion?: string;
}

// --- Auth ---
export interface LoginRequestAPI {
  email: string;
  password: string;
}

export interface TokenResponseAPI {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// --- Decreto ---
export interface DecretoAPI {
  id: number;
  municipio_id: number;
  numero_decreto?: string;
  descripcion?: string;
  hora_inicio: string;
  hora_fin: string;
  dias_restriccion: string;
  digitos_restringidos: string;
  vigencia_desde: string;
  vigencia_hasta?: string;
  is_active: boolean;
}

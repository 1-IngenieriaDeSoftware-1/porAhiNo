/**
 * Utilidades puras de GPS (sin React, sin DOM) para navegación.
 *
 * Convenciones: coordenadas de polilíneas GeoJSON como [lon, lat];
 * puntos sueltos como { lat, lon }. Distancias en metros, velocidades en m/s,
 * rumbos en grados [0, 360) medidos desde el norte en sentido horario.
 */

export interface GpsFix {
  lat: number;
  lon: number;
  /** Precisión horizontal en metros (null si el dispositivo no la reporta). */
  accuracy: number | null;
  /** Velocidad en m/s (reportada o derivada del movimiento). */
  speed: number | null;
  /** Rumbo en grados [0,360) o null si aún no hay dato fiable. */
  heading: number | null;
  /** Epoch ms de la lectura. */
  timestamp: number;
}

export interface GpsRawReading {
  lat: number;
  lon: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface GpsTrackingOptions {
  /** Activa/desactiva el seguimiento. Default true. */
  enabled?: boolean;
  /** Descarta lecturas con accuracy mayor a este valor (m). Default 40. */
  maxAccuracyM?: number;
  /** Descarta saltos con velocidad implícita mayor (m/s). Default 70 (~250 km/h). */
  maxSpeedMps?: number;
  /** Suavizado Kalman 1D sobre lat/lon. Default true. */
  smooth?: boolean;
  /** Velocidad mínima (m/s) para calcular rumbo desde el movimiento. Default 2. */
  headingMinSpeedMps?: number;
  /** Ruido de proceso del Kalman (m/s). Default 3. */
  kalmanProcessNoise?: number;
  /**
   * Solicita seguimiento con pantalla apagada. Solo tiene efecto si el flag
   * NEXT_PUBLIC_GPS_BACKGROUND=1 y hay plugin nativo instalado (ver docs/ANDROID.md).
   */
  background?: boolean;
}

export type GpsStatus = 'idle' | 'starting' | 'tracking' | 'denied' | 'unavailable' | 'error';

export interface GpsTrackingState {
  status: GpsStatus;
  /** Última posición aceptada y suavizada. */
  fix: GpsFix | null;
  /** Última lectura aceptada sin suavizar (útil para depuración). */
  rawFix: GpsFix | null;
  error: string | null;
  acceptedCount: number;
  discardedCount: number;
  /** Motivo del último descarte, si lo hubo. */
  lastDiscardReason: DiscardReason | null;
  /** true si el modo background fue solicitado pero no está activo. */
  backgroundRequested: boolean;
  isNative: boolean;
}

export type DiscardReason = 'accuracy' | 'stale' | 'jump' | 'invalid';

export const DEFAULT_MAX_ACCURACY_M = 40;
export const DEFAULT_MAX_SPEED_MPS = 70;
export const DEFAULT_HEADING_MIN_SPEED_MPS = 2;
export const OFF_ROUTE_BASE_M = 40;
export const OFF_ROUTE_CONSECUTIVE = 3;
export const CAMERA_ALERT_RADIUS_M = 300;

/** Flag de build para seguimiento con pantalla apagada (preparado, desactivado por defecto). */
export const GPS_BACKGROUND_ENABLED =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GPS_BACKGROUND === '1';

const EARTH_R = 6371000;
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

export function normalizeBearing(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Diferencia angular mínima absoluta entre dos rumbos, en [0, 180]. */
export function angleDiffDeg(a: number, b: number): number {
  const d = Math.abs(normalizeBearing(a) - normalizeBearing(b));
  return d > 180 ? 360 - d : d;
}

/** Diferencia con signo b - a en (-180, 180]; positivo = giro a la derecha. */
export function signedAngleDiffDeg(a: number, b: number): number {
  let d = normalizeBearing(b) - normalizeBearing(a);
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

export function haversineM(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Rumbo inicial de a hacia b en grados [0,360). */
export function bearingDeg(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δλ = toRad(b.lon - a.lon);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return normalizeBearing(toDeg(Math.atan2(y, x)));
}

/* -------------------------------------------------------------------------- */
/* Filtros de calidad                                                          */
/* -------------------------------------------------------------------------- */

/** true si la lectura tiene precisión aceptable. accuracy ausente se acepta. */
export function isAccuracyAcceptable(
  accuracy: number | null | undefined,
  maxAccuracyM: number = DEFAULT_MAX_ACCURACY_M,
): boolean {
  if (accuracy == null || Number.isNaN(accuracy)) return true;
  return accuracy >= 0 && accuracy <= maxAccuracyM;
}

/** Velocidad implícita (m/s) entre dos lecturas; null si dt <= 0. */
export function impliedSpeedMps(
  prev: { lat: number; lon: number; timestamp: number },
  next: { lat: number; lon: number; timestamp: number },
): number | null {
  const dt = (next.timestamp - prev.timestamp) / 1000;
  if (dt <= 0) return null;
  return haversineM(prev, next) / dt;
}

export function isImpossibleJump(
  prev: { lat: number; lon: number; timestamp: number },
  next: { lat: number; lon: number; timestamp: number },
  maxSpeedMps: number = DEFAULT_MAX_SPEED_MPS,
): boolean {
  const v = impliedSpeedMps(prev, next);
  return v != null && v > maxSpeedMps;
}

/* -------------------------------------------------------------------------- */
/* Kalman 1D                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Kalman 1D de posición con varianza en m². El estado `x` está en las unidades
 * de la medida (grados); la varianza `p` y el ruido `r` siempre en m², lo que
 * permite ponderar por accuracy del GPS sin convertir unidades.
 */
export class Kalman1D {
  x = 0;
  /** Varianza (m²); negativa = sin inicializar. */
  p = -1;
  private lastTs = 0;
  private readonly processNoiseMps: number;

  constructor(processNoiseMps: number = 3) {
    this.processNoiseMps = processNoiseMps;
  }

  get initialized(): boolean {
    return this.p >= 0;
  }

  reset(): void {
    this.p = -1;
    this.x = 0;
    this.lastTs = 0;
  }

  update(measurement: number, accuracyM: number, timestampMs: number): number {
    const r = Math.max(accuracyM, 1) ** 2;
    if (!this.initialized) {
      this.x = measurement;
      this.p = r;
      this.lastTs = timestampMs;
      return this.x;
    }
    const dt = Math.max(0, (timestampMs - this.lastTs) / 1000);
    this.lastTs = timestampMs;
    // Predicción: la incertidumbre crece con el tiempo.
    this.p += dt * this.processNoiseMps ** 2;
    // Corrección.
    const k = this.p / (this.p + r);
    this.x += k * (measurement - this.x);
    this.p = (1 - k) * this.p;
    return this.x;
  }
}

/* -------------------------------------------------------------------------- */
/* Pipeline: filtro + suavizado + rumbo                                         */
/* -------------------------------------------------------------------------- */

export interface GpsPipelineConfig {
  maxAccuracyM: number;
  maxSpeedMps: number;
  smooth: boolean;
  headingMinSpeedMps: number;
  kalmanProcessNoise: number;
}

export const DEFAULT_PIPELINE_CONFIG: GpsPipelineConfig = {
  maxAccuracyM: DEFAULT_MAX_ACCURACY_M,
  maxSpeedMps: DEFAULT_MAX_SPEED_MPS,
  smooth: true,
  headingMinSpeedMps: DEFAULT_HEADING_MIN_SPEED_MPS,
  kalmanProcessNoise: 3,
};

export type PipelineResult =
  | { accepted: true; fix: GpsFix; raw: GpsFix }
  | { accepted: false; reason: DiscardReason };

/** Tras N saltos imposibles seguidos se re-ancla (probable teleport legítimo / mala lectura previa). */
const MAX_CONSECUTIVE_JUMPS = 4;
/** Movimiento mínimo (m) entre fixes para fiarse del rumbo derivado. */
const MIN_MOVE_FOR_HEADING_M = 2.5;

export class GpsPipeline {
  private cfg: GpsPipelineConfig;
  private kLat: Kalman1D;
  private kLon: Kalman1D;
  private lastRaw: GpsFix | null = null;
  private lastFix: GpsFix | null = null;
  private lastHeading: number | null = null;
  private jumpStreak = 0;

  constructor(cfg: Partial<GpsPipelineConfig> = {}) {
    this.cfg = { ...DEFAULT_PIPELINE_CONFIG, ...cfg };
    this.kLat = new Kalman1D(this.cfg.kalmanProcessNoise);
    this.kLon = new Kalman1D(this.cfg.kalmanProcessNoise);
  }

  reset(): void {
    this.kLat.reset();
    this.kLon.reset();
    this.lastRaw = null;
    this.lastFix = null;
    this.lastHeading = null;
    this.jumpStreak = 0;
  }

  process(reading: GpsRawReading): PipelineResult {
    if (
      !Number.isFinite(reading.lat) ||
      !Number.isFinite(reading.lon) ||
      Math.abs(reading.lat) > 90 ||
      Math.abs(reading.lon) > 180
    ) {
      return { accepted: false, reason: 'invalid' };
    }
    if (!isAccuracyAcceptable(reading.accuracy, this.cfg.maxAccuracyM)) {
      return { accepted: false, reason: 'accuracy' };
    }
    if (this.lastRaw) {
      if (reading.timestamp <= this.lastRaw.timestamp) {
        return { accepted: false, reason: 'stale' };
      }
      if (isImpossibleJump(this.lastRaw, reading, this.cfg.maxSpeedMps)) {
        this.jumpStreak += 1;
        if (this.jumpStreak < MAX_CONSECUTIVE_JUMPS) {
          return { accepted: false, reason: 'jump' };
        }
        // Re-anclaje: descartamos el estado previo.
        this.kLat.reset();
        this.kLon.reset();
        this.lastRaw = null;
        this.lastFix = null;
        this.lastHeading = null;
      }
    }
    this.jumpStreak = 0;

    const acc = reading.accuracy ?? 10;
    let lat = reading.lat;
    let lon = reading.lon;
    if (this.cfg.smooth) {
      lat = this.kLat.update(reading.lat, acc, reading.timestamp);
      lon = this.kLon.update(reading.lon, acc, reading.timestamp);
    }

    const raw: GpsFix = {
      lat: reading.lat,
      lon: reading.lon,
      accuracy: reading.accuracy,
      speed: reading.speed,
      heading: reading.heading,
      timestamp: reading.timestamp,
    };

    // Velocidad: la reportada si existe; si no, derivada del movimiento.
    let speed = reading.speed != null && reading.speed >= 0 ? reading.speed : null;
    let moveM = 0;
    if (this.lastFix) {
      const dtS = (reading.timestamp - this.lastFix.timestamp) / 1000;
      moveM = haversineM(this.lastFix, { lat, lon });
      if (speed == null && dtS > 0) speed = moveM / dtS;
    }

    // Rumbo: del movimiento si speed > umbral; si no, el del dispositivo o el último.
    let heading: number | null = this.lastHeading;
    if (speed != null && speed > this.cfg.headingMinSpeedMps && this.lastFix && moveM >= MIN_MOVE_FOR_HEADING_M) {
      heading = bearingDeg(this.lastFix, { lat, lon });
    } else if (
      speed != null &&
      speed > this.cfg.headingMinSpeedMps &&
      reading.heading != null &&
      Number.isFinite(reading.heading)
    ) {
      heading = normalizeBearing(reading.heading);
    }
    if (heading != null) this.lastHeading = heading;

    const fix: GpsFix = {
      lat,
      lon,
      accuracy: reading.accuracy,
      speed,
      heading,
      timestamp: reading.timestamp,
    };
    this.lastRaw = raw;
    this.lastFix = fix;
    return { accepted: true, fix, raw };
  }
}

/* -------------------------------------------------------------------------- */
/* Geometría sobre polilíneas ([lon, lat])                                      */
/* -------------------------------------------------------------------------- */

export type LonLat = number[]; // [lon, lat]

interface Projection {
  /** Distancia mínima en metros al segmento. */
  distM: number;
  /** Fracción [0,1] del punto proyectado sobre el segmento. */
  t: number;
  /** Longitud del segmento en metros. */
  segLenM: number;
}

/** Proyección equirectangular local (suficiente para segmentos urbanos). */
function projectToSegment(p: { lat: number; lon: number }, a: LonLat, b: LonLat): Projection {
  const cosLat = Math.cos(toRad(p.lat));
  const mPerDegLat = (Math.PI / 180) * EARTH_R;
  const mPerDegLon = mPerDegLat * cosLat;
  const ax = (a[0] - p.lon) * mPerDegLon;
  const ay = (a[1] - p.lat) * mPerDegLat;
  const bx = (b[0] - p.lon) * mPerDegLon;
  const by = (b[1] - p.lat) * mPerDegLat;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = 0;
  if (len2 > 0) t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return { distM: Math.hypot(cx, cy), t, segLenM: Math.sqrt(len2) };
}

/** Distancia mínima (m) de un punto a una polilínea. Infinity si hay < 2 vértices. */
export function distanceToPolylineM(
  point: { lat: number; lon: number },
  polyline: LonLat[],
): number {
  if (polyline.length < 2) return Number.POSITIVE_INFINITY;
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < polyline.length - 1; i++) {
    const { distM } = projectToSegment(point, polyline[i], polyline[i + 1]);
    if (distM < best) best = distM;
  }
  return best;
}

export function polylineLengthM(polyline: LonLat[]): number {
  let total = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    total += haversineM(
      { lat: polyline[i][1], lon: polyline[i][0] },
      { lat: polyline[i + 1][1], lon: polyline[i + 1][0] },
    );
  }
  return total;
}

export interface RouteProgress {
  /** Metros recorridos desde el inicio hasta el punto proyectado. */
  alongM: number;
  totalM: number;
  remainingM: number;
  /** Fracción [0,1]. */
  fraction: number;
  /** Índice del segmento más cercano. */
  segmentIndex: number;
  /** Distancia perpendicular a la ruta (m). */
  offsetM: number;
}

/** Progreso del punto sobre la ruta (proyección al segmento más cercano). */
export function routeProgress(
  point: { lat: number; lon: number },
  polyline: LonLat[],
): RouteProgress | null {
  if (polyline.length < 2) return null;
  let bestDist = Number.POSITIVE_INFINITY;
  let bestIdx = 0;
  let cumulative = 0;
  let bestCumulative = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i];
    const b = polyline[i + 1];
    const { distM, t } = projectToSegment(point, a, b);
    const segLen = haversineM({ lat: a[1], lon: a[0] }, { lat: b[1], lon: b[0] });
    if (distM < bestDist) {
      bestDist = distM;
      bestIdx = i;
      bestCumulative = cumulative + t * segLen;
    }
    cumulative += segLen;
  }
  const total = cumulative;
  const alongM = Math.min(bestCumulative, total);
  return {
    alongM,
    totalM: total,
    remainingM: Math.max(0, total - alongM),
    fraction: total > 0 ? alongM / total : 0,
    segmentIndex: bestIdx,
    offsetM: bestDist,
  };
}

/* -------------------------------------------------------------------------- */
/* Detección fuera de ruta                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Umbral efectivo (m): base + mitad de la incertidumbre del fix. Un fix con
 * accuracy 30 m tolera 55 m antes de considerarse desviado, evitando falsos
 * positivos en cañones urbanos.
 */
export function offRouteThresholdM(
  accuracyM: number | null | undefined,
  baseM: number = OFF_ROUTE_BASE_M,
): number {
  const acc = accuracyM != null && Number.isFinite(accuracyM) ? Math.max(0, accuracyM) : 0;
  return baseM + acc * 0.5;
}

export function isOffRouteReading(
  point: { lat: number; lon: number },
  accuracyM: number | null | undefined,
  polyline: LonLat[],
  baseM: number = OFF_ROUTE_BASE_M,
): boolean {
  const d = distanceToPolylineM(point, polyline);
  if (!Number.isFinite(d)) return false;
  return d > offRouteThresholdM(accuracyM, baseM);
}

/** Cuenta lecturas consecutivas fuera de ruta; `update` devuelve true al alcanzar N. */
export class OffRouteDetector {
  private streak = 0;
  private readonly consecutive: number;
  private readonly baseM: number;

  constructor(
    consecutive: number = OFF_ROUTE_CONSECUTIVE,
    baseM: number = OFF_ROUTE_BASE_M,
  ) {
    this.consecutive = consecutive;
    this.baseM = baseM;
  }

  get count(): number {
    return this.streak;
  }

  reset(): void {
    this.streak = 0;
  }

  update(
    point: { lat: number; lon: number },
    accuracyM: number | null | undefined,
    polyline: LonLat[],
  ): boolean {
    if (polyline.length < 2) {
      this.streak = 0;
      return false;
    }
    if (isOffRouteReading(point, accuracyM, polyline, this.baseM)) {
      this.streak += 1;
    } else {
      this.streak = 0;
    }
    return this.streak >= this.consecutive;
  }
}

/* -------------------------------------------------------------------------- */
/* Próxima maniobra (derivada de la geometría)                                  */
/* -------------------------------------------------------------------------- */

export type ManeuverKind = 'left' | 'right' | 'slight-left' | 'slight-right' | 'uturn' | 'arrive';

export interface NextManeuver {
  kind: ManeuverKind;
  /** Metros desde la posición actual hasta la maniobra. */
  distanceM: number;
  /** Cambio de rumbo con signo (positivo = derecha). */
  turnDeg: number;
}

const TURN_MIN_DEG = 25;
/** Longitud mínima (m) de tramo para estimar rumbos estables. */
const TURN_LOOK_M = 20;

function classifyTurn(delta: number): ManeuverKind | null {
  const abs = Math.abs(delta);
  if (abs < TURN_MIN_DEG) return null;
  if (abs > 150) return 'uturn';
  if (abs >= 60) return delta > 0 ? 'right' : 'left';
  return delta > 0 ? 'slight-right' : 'slight-left';
}

/**
 * Busca el siguiente giro significativo por delante del progreso actual.
 * Compara el rumbo de ~20 m antes del vértice con ~20 m después. Si no hay giro,
 * devuelve 'arrive' con la distancia restante.
 */
export function nextManeuver(
  polyline: LonLat[],
  progress: RouteProgress | null,
): NextManeuver | null {
  if (!progress || polyline.length < 2) return null;
  // Longitudes acumuladas por vértice.
  const cum: number[] = [0];
  for (let i = 1; i < polyline.length; i++) {
    cum.push(
      cum[i - 1] +
        haversineM(
          { lat: polyline[i - 1][1], lon: polyline[i - 1][0] },
          { lat: polyline[i][1], lon: polyline[i][0] },
        ),
    );
  }
  const pointAt = (d: number): { lat: number; lon: number } => {
    const dist = Math.max(0, Math.min(d, cum[cum.length - 1]));
    let i = 1;
    while (i < cum.length - 1 && cum[i] < dist) i++;
    const segLen = cum[i] - cum[i - 1];
    const t = segLen > 0 ? (dist - cum[i - 1]) / segLen : 0;
    return {
      lon: polyline[i - 1][0] + t * (polyline[i][0] - polyline[i - 1][0]),
      lat: polyline[i - 1][1] + t * (polyline[i][1] - polyline[i - 1][1]),
    };
  };

  const total = cum[cum.length - 1];
  for (let i = progress.segmentIndex + 1; i < polyline.length - 1; i++) {
    const vertexD = cum[i];
    if (vertexD <= progress.alongM + 1) continue;
    const before = pointAt(vertexD - TURN_LOOK_M);
    const vertex = { lon: polyline[i][0], lat: polyline[i][1] };
    const after = pointAt(vertexD + TURN_LOOK_M);
    if (haversineM(before, vertex) < 3 || haversineM(vertex, after) < 3) continue;
    const delta = signedAngleDiffDeg(bearingDeg(before, vertex), bearingDeg(vertex, after));
    const kind = classifyTurn(delta);
    if (kind) {
      return { kind, distanceM: Math.max(0, vertexD - progress.alongM), turnDeg: delta };
    }
  }
  return { kind: 'arrive', distanceM: Math.max(0, total - progress.alongM), turnDeg: 0 };
}

export function maneuverLabel(kind: ManeuverKind): string {
  switch (kind) {
    case 'left':
      return 'Gira a la izquierda';
    case 'right':
      return 'Gira a la derecha';
    case 'slight-left':
      return 'Leve a la izquierda';
    case 'slight-right':
      return 'Leve a la derecha';
    case 'uturn':
      return 'Retorno';
    case 'arrive':
      return 'Llegada al destino';
  }
}

export function formatDistance(m: number): string {
  if (!Number.isFinite(m)) return '—';
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

/* -------------------------------------------------------------------------- */
/* Cámaras por delante                                                         */
/* -------------------------------------------------------------------------- */

export interface CameraPoint {
  id: number | string;
  nombre: string;
  lat: number;
  lon: number;
}

export interface CameraAhead<T extends CameraPoint = CameraPoint> {
  camera: T;
  distanceM: number;
  /** Diferencia angular entre el rumbo y la dirección a la cámara. */
  offAxisDeg: number;
}

/**
 * Cámaras a menos de `radiusM` y dentro de ±`halfConeDeg` del rumbo actual.
 * Sin rumbo no se emiten alertas (evita avisos de cámaras detrás).
 */
export function camerasAhead<T extends CameraPoint>(
  point: { lat: number; lon: number },
  heading: number | null | undefined,
  cameras: T[],
  radiusM: number = CAMERA_ALERT_RADIUS_M,
  halfConeDeg = 45,
): CameraAhead<T>[] {
  if (heading == null || !Number.isFinite(heading)) return [];
  const out: CameraAhead<T>[] = [];
  for (const camera of cameras) {
    const distanceM = haversineM(point, camera);
    if (distanceM > radiusM) continue;
    const off = angleDiffDeg(heading, bearingDeg(point, camera));
    if (distanceM < 25 || off <= halfConeDeg) {
      out.push({ camera, distanceM, offAxisDeg: off });
    }
  }
  return out.sort((a, b) => a.distanceM - b.distanceM);
}

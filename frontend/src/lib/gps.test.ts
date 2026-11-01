import { describe, expect, it } from 'vitest';
import {
  GpsPipeline,
  Kalman1D,
  OffRouteDetector,
  angleDiffDeg,
  bearingDeg,
  camerasAhead,
  distanceToPolylineM,
  haversineM,
  isAccuracyAcceptable,
  isImpossibleJump,
  nextManeuver,
  offRouteThresholdM,
  routeProgress,
  type GpsRawReading,
  type LonLat,
} from './gps';

// Referencia: Bogotá. 0.001° lat ≈ 111 m.
const BASE = { lat: 4.65, lon: -74.08 };
const M_PER_DEG_LAT = 111_195;
const north = (m: number) => BASE.lat + m / M_PER_DEG_LAT;

function reading(over: Partial<GpsRawReading> & { t: number }): GpsRawReading {
  const { t, ...rest } = over;
  return {
    lat: BASE.lat,
    lon: BASE.lon,
    accuracy: 5,
    speed: null,
    heading: null,
    timestamp: 1_000_000 + t * 1000,
    ...rest,
  };
}

// Ruta recta hacia el norte, ~1 km.
const ROUTE_N: LonLat[] = [
  [BASE.lon, BASE.lat],
  [BASE.lon, north(500)],
  [BASE.lon, north(1000)],
];

describe('accuracy filter', () => {
  it('acepta <= 40 m y rechaza > 40 m', () => {
    expect(isAccuracyAcceptable(10)).toBe(true);
    expect(isAccuracyAcceptable(40)).toBe(true);
    expect(isAccuracyAcceptable(40.1)).toBe(false);
    expect(isAccuracyAcceptable(80)).toBe(false);
  });

  it('es configurable', () => {
    expect(isAccuracyAcceptable(60, 100)).toBe(true);
    expect(isAccuracyAcceptable(25, 20)).toBe(false);
  });

  it('el pipeline descarta lecturas imprecisas', () => {
    const p = new GpsPipeline();
    const r = p.process(reading({ t: 0, accuracy: 120 }));
    expect(r).toEqual({ accepted: false, reason: 'accuracy' });
    expect(p.process(reading({ t: 1, accuracy: 8 })).accepted).toBe(true);
  });

  it('descarta saltos imposibles y lecturas viejas', () => {
    const p = new GpsPipeline({ maxSpeedMps: 70 });
    expect(p.process(reading({ t: 0 })).accepted).toBe(true);
    // ~5.5 km en 1 s
    const jump = p.process(reading({ t: 1, lat: BASE.lat + 0.05 }));
    expect(jump).toEqual({ accepted: false, reason: 'jump' });
    const stale = p.process(reading({ t: 0 }));
    expect(stale).toEqual({ accepted: false, reason: 'stale' });
    expect(isImpossibleJump(
      { ...BASE, timestamp: 0 },
      { lat: BASE.lat + 0.05, lon: BASE.lon, timestamp: 1000 },
    )).toBe(true);
  });

  it('re-ancla tras varios saltos consecutivos', () => {
    const p = new GpsPipeline();
    p.process(reading({ t: 0 }));
    const far = BASE.lat + 0.5;
    let last = p.process(reading({ t: 1, lat: far }));
    for (let i = 2; i <= 4; i++) last = p.process(reading({ t: i, lat: far }));
    expect(last.accepted).toBe(true);
  });
});

describe('Kalman1D', () => {
  it('reduce el ruido respecto a la medida cruda', () => {
    const k = new Kalman1D(1);
    const truth = 4.65;
    // Ruido determinista ±~8 m en grados
    const noise = [8, -7, 6, -9, 7, -6, 9, -8, 5, -5, 8, -7];
    let rawErr = 0;
    let filtErr = 0;
    noise.forEach((n, i) => {
      const z = truth + n / M_PER_DEG_LAT;
      const x = k.update(z, 10, 1000 * i);
      if (i >= 4) {
        rawErr += Math.abs(z - truth);
        filtErr += Math.abs(x - truth);
      }
    });
    expect(filtErr).toBeLessThan(rawErr * 0.6);
  });

  it('se inicializa con la primera medida', () => {
    const k = new Kalman1D();
    expect(k.update(10, 5, 0)).toBe(10);
  });

  it('pondera más la medida precisa que la imprecisa', () => {
    const a = new Kalman1D(0.1);
    a.update(0, 5, 0);
    const preciso = a.update(1, 1, 1000);
    const b = new Kalman1D(0.1);
    b.update(0, 5, 0);
    const impreciso = b.update(1, 40, 1000);
    expect(preciso).toBeGreaterThan(impreciso);
  });
});

describe('heading desde movimiento', () => {
  it('calcula rumbo norte cuando speed > 2 m/s', () => {
    const p = new GpsPipeline({ smooth: false });
    p.process(reading({ t: 0 }));
    const r = p.process(reading({ t: 1, lat: north(10) }));
    expect(r.accepted).toBe(true);
    if (r.accepted) {
      expect(r.fix.speed).toBeGreaterThan(2);
      expect(r.fix.heading).not.toBeNull();
      expect(angleDiffDeg(r.fix.heading as number, 0)).toBeLessThan(2);
    }
  });

  it('no inventa rumbo parado', () => {
    const p = new GpsPipeline({ smooth: false });
    p.process(reading({ t: 0 }));
    const r = p.process(reading({ t: 5, lat: north(1) }));
    expect(r.accepted && r.fix.heading).toBeNull();
  });
});

describe('geometría de ruta', () => {
  it('distancia a polilínea', () => {
    const lonOffset = 30 / (M_PER_DEG_LAT * Math.cos((BASE.lat * Math.PI) / 180));
    const d = distanceToPolylineM({ lat: north(250), lon: BASE.lon + lonOffset }, ROUTE_N);
    expect(d).toBeGreaterThan(28);
    expect(d).toBeLessThan(32);
    expect(distanceToPolylineM(BASE, [])).toBe(Infinity);
  });

  it('progreso a lo largo de la ruta', () => {
    const p = routeProgress({ lat: north(500), lon: BASE.lon }, ROUTE_N);
    expect(p).not.toBeNull();
    expect(p!.fraction).toBeGreaterThan(0.48);
    expect(p!.fraction).toBeLessThan(0.52);
    expect(p!.remainingM).toBeGreaterThan(480);
  });

  it('haversine y bearing básicos', () => {
    expect(haversineM(BASE, { lat: north(1000), lon: BASE.lon })).toBeGreaterThan(990);
    expect(bearingDeg(BASE, { lat: north(100), lon: BASE.lon })).toBeCloseTo(0, 1);
  });
});

describe('detección fuera de ruta', () => {
  const lonDeg = (m: number) => m / (M_PER_DEG_LAT * Math.cos((BASE.lat * Math.PI) / 180));
  const off = (m: number) => ({ lat: north(300), lon: BASE.lon + lonDeg(m) });

  it('umbral se ajusta por accuracy', () => {
    expect(offRouteThresholdM(0)).toBe(40);
    expect(offRouteThresholdM(20)).toBe(50);
    expect(offRouteThresholdM(null)).toBe(40);
  });

  it('dispara tras 3 lecturas consecutivas > 40 m', () => {
    const d = new OffRouteDetector();
    expect(d.update(off(60), 5, ROUTE_N)).toBe(false);
    expect(d.update(off(60), 5, ROUTE_N)).toBe(false);
    expect(d.update(off(60), 5, ROUTE_N)).toBe(true);
  });

  it('una lectura dentro de la ruta reinicia el contador', () => {
    const d = new OffRouteDetector();
    d.update(off(60), 5, ROUTE_N);
    d.update(off(60), 5, ROUTE_N);
    expect(d.update(off(5), 5, ROUTE_N)).toBe(false);
    expect(d.count).toBe(0);
    expect(d.update(off(60), 5, ROUTE_N)).toBe(false);
  });

  it('no dispara si el desvío cae dentro del umbral ajustado por accuracy', () => {
    const d = new OffRouteDetector();
    // 48 m con accuracy 30 → umbral 55 m
    for (let i = 0; i < 5; i++) expect(d.update(off(48), 30, ROUTE_N)).toBe(false);
    // mismos 48 m con accuracy 5 → umbral 42.5 m → sí dispara
    const d2 = new OffRouteDetector();
    d2.update(off(48), 5, ROUTE_N);
    d2.update(off(48), 5, ROUTE_N);
    expect(d2.update(off(48), 5, ROUTE_N)).toBe(true);
  });

  it('sin ruta no hay desvío', () => {
    expect(new OffRouteDetector().update(off(500), 5, [])).toBe(false);
  });
});

describe('maniobras y cámaras', () => {
  it('detecta giro a la derecha por delante', () => {
    const lonDeg = 500 / (M_PER_DEG_LAT * Math.cos((BASE.lat * Math.PI) / 180));
    const route: LonLat[] = [
      [BASE.lon, BASE.lat],
      [BASE.lon, north(500)],
      [BASE.lon + lonDeg, north(500)],
    ];
    const prog = routeProgress({ lat: north(100), lon: BASE.lon }, route);
    const m = nextManeuver(route, prog);
    expect(m?.kind).toBe('right');
    expect(m!.distanceM).toBeGreaterThan(380);
    expect(m!.distanceM).toBeLessThan(420);
  });

  it('sin giros devuelve llegada', () => {
    const prog = routeProgress({ lat: north(100), lon: BASE.lon }, ROUTE_N);
    expect(nextManeuver(ROUTE_N, prog)?.kind).toBe('arrive');
  });

  it('cámaras < 300 m solo por delante del rumbo', () => {
    const cams = [
      { id: 1, nombre: 'delante', lat: north(200), lon: BASE.lon },
      { id: 2, nombre: 'detrás', lat: north(-200), lon: BASE.lon },
      { id: 3, nombre: 'lejos', lat: north(600), lon: BASE.lon },
    ];
    const res = camerasAhead(BASE, 0, cams);
    expect(res.map((r) => r.camera.id)).toEqual([1]);
    expect(camerasAhead(BASE, null, cams)).toEqual([]);
  });
});

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { GeoJSONSource, Map, Marker } from 'maplibre-gl';
import type { LayerSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import consultaService from '@/services/consultaService';
import {
  CamaraAPI,
  RutaOpcion,
  RutaResponse,
  SemaforoAPI,
  ZonaAPI,
  isAbortError,
  rutasService,
} from '@/services/rutasService';
import { useGpsTracking } from '@/hooks/useGpsTracking';
import {
  CAMERA_ALERT_RADIUS_M,
  OffRouteDetector,
  camerasAhead,
  formatDistance,
  haversineM,
  maneuverLabel,
  nextManeuver,
  routeProgress,
  type GpsFix,
  type LonLat,
} from '@/lib/gps';
import type { MunicipioAPI } from '@/types/api';
import { apiErrorMessage } from '@/lib/utils';

const CITY_CENTER: Record<number, [number, number]> = {
  1: [-74.08, 4.65],
  2: [-75.57, 6.24],
  3: [-76.53, 3.44],
};

/** Espera mínima entre recálculos automáticos (ms). Rango recomendado 5–10 s. */
const RECALC_COOLDOWN_MS = 8000;
/** Intervalo mínimo entre llamadas a POST /rutas/match (ms). */
const MATCH_INTERVAL_MS = 5000;
const MATCH_MAX_POINTS = 12;
const MATCH_MIN_STEP_M = 5;
const MATCH_MAX_FAILURES = 3;
/** Distancia (m) al destino para dar la navegación por finalizada. */
const ARRIVAL_M = 30;
/** Fuera de este radio la cámara se "rearma" para volver a avisar. */
const CAMERA_REARM_M = CAMERA_ALERT_RADIUS_M + 100;
const PREFS_KEY = 'porahino.nav.prefs';

type ClickMode = 'origen' | 'destino' | null;
type Pt = { lat: number; lon: number };
type TipoRuta = 'directa' | 'alternativa';

interface NavPrefs {
  alertaCamaras: boolean;
  sonido: boolean;
  vibracion: boolean;
  seguir: boolean;
}

const DEFAULT_PREFS: NavPrefs = { alertaCamaras: true, sonido: false, vibracion: false, seguir: true };

function loadPrefs(): NavPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

const EMPTY_FC = { type: 'FeatureCollection' as const, features: [] as never[] };
const EMPTY_LINE = {
  type: 'Feature' as const,
  properties: {},
  geometry: { type: 'LineString' as const, coordinates: [] as number[][] },
};

/** Crea fuentes y capas vacías en orden de apilado (zonas < semáforos < cámaras < rutas). */
function initLayers(map: Map) {
  const add = (id: string, data: GeoJSON.GeoJSON, layers: LayerSpecification[]) => {
    if (!map.getSource(id)) map.addSource(id, { type: 'geojson', data });
    layers.forEach((l) => {
      if (!map.getLayer(l.id)) map.addLayer(l);
    });
  };
  add('zonas', EMPTY_FC, [
    { id: 'zonas-fill', type: 'fill', source: 'zonas', paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.25 } },
    { id: 'zonas-line', type: 'line', source: 'zonas', paint: { 'line-color': '#b91c1c', 'line-width': 2 } },
  ]);
  add('semaforos', EMPTY_FC, [
    {
      id: 'semaforos-circle',
      type: 'circle',
      source: 'semaforos',
      minzoom: 12,
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': 4,
        'circle-color': '#16a34a',
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#fff',
      },
    },
  ]);
  add('camaras', EMPTY_FC, [
    {
      id: 'camaras-circle',
      type: 'circle',
      source: 'camaras',
      paint: {
        'circle-radius': 7,
        'circle-color': '#f59e0b',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    },
  ]);
  const routeLayer = (id: string, color: string): LayerSpecification => ({
    id: `${id}-line`,
    type: 'line',
    source: id,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': color, 'line-width': 5, 'line-opacity': 0.85 },
  });
  add('ruta-directa', EMPTY_LINE, [routeLayer('ruta-directa', '#64748b')]);
  add('ruta-alternativa', EMPTY_LINE, [routeLayer('ruta-alternativa', '#0f766e')]);
}

function setData(map: Map, id: string, data: GeoJSON.GeoJSON) {
  (map.getSource(id) as GeoJSONSource | undefined)?.setData(data);
}

function setVisible(map: Map, layerId: string, visible: boolean) {
  if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
}

function createPositionElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.width = '28px';
  el.style.height = '28px';
  el.innerHTML = `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
    <circle cx="14" cy="14" r="12" fill="#2563eb" fill-opacity="0.18"/>
    <path d="M14 3 L21 22 L14 18 L7 22 Z" fill="#2563eb" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
  </svg>`;
  return el;
}

export default function NavegacionMap() {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const origenMarker = useRef<Marker | null>(null);
  const destinoMarker = useRef<Marker | null>(null);
  const posMarker = useRef<Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const [municipios, setMunicipios] = useState<MunicipioAPI[]>([]);
  const [municipioId, setMunicipioId] = useState<number>(1);
  const [placa, setPlaca] = useState('ABC123');
  const [horaSalida, setHoraSalida] = useState('');
  const [origen, setOrigen] = useState<Pt | null>(null);
  const [destino, setDestino] = useState<Pt | null>(null);
  const [clickMode, setClickMode] = useState<ClickMode>('origen');
  const clickModeRef = useRef<ClickMode>('origen');
  const [resultado, setResultado] = useState<RutaResponse | null>(null);
  const [tipoSel, setTipoSel] = useState<TipoRuta>('alternativa');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoQ, setGeoQ] = useState('');
  const [geoHits, setGeoHits] = useState<{ display_name: string; lat: number; lon: number }[]>([]);
  const [showCamaras, setShowCamaras] = useState(true);
  const [showZonas, setShowZonas] = useState(true);
  const [showSemaforos, setShowSemaforos] = useState(false);
  const [zonas, setZonas] = useState<ZonaAPI[]>([]);
  const [camaras, setCamaras] = useState<CamaraAPI[]>([]);
  const [semaforos, setSemaforos] = useState<SemaforoAPI[]>([]);
  const [prefs, setPrefs] = useState<NavPrefs>(loadPrefs);

  // Navegación activa / recálculo
  const [navegando, setNavegando] = useState(false);
  const [buscandoOrigen, setBuscandoOrigen] = useState(false);
  const [recalculando, setRecalculando] = useState(false);
  const [llegada, setLlegada] = useState(false);
  const [camaraAviso, setCamaraAviso] = useState<{ nombre: string; distanciaM: number } | null>(null);

  const detectorRef = useRef(new OffRouteDetector());
  const reqAbortRef = useRef<AbortController | null>(null);
  const matchAbortRef = useRef<AbortController | null>(null);
  const lastRecalcRef = useRef(0);
  const lastMatchRef = useRef(0);
  const matchFailuresRef = useRef(0);
  const traceRef = useRef<Pt[]>([]);
  const snappedRef = useRef<{ pt: Pt; at: number } | null>(null);
  const alertedRef = useRef<Set<number | string>>(new Set());
  const audioRef = useRef<AudioContext | null>(null);

  // Fuente única de posición.
  const gps = useGpsTracking({ enabled: navegando || buscandoOrigen });
  const fix = gps.fix;

  const rutaActiva: RutaOpcion | null = useMemo(() => {
    if (!resultado) return null;
    const viables = resultado.rutas.filter((r) => r.viable);
    return viables.find((r) => r.tipo === tipoSel) ?? viables[0] ?? null;
  }, [resultado, tipoSel]);

  const rutaCoords: LonLat[] = useMemo(() => rutaActiva?.geometria.coordinates ?? [], [rutaActiva]);

  const progreso = useMemo(
    () => (navegando && fix ? routeProgress(fix, rutaCoords) : null),
    [navegando, fix, rutaCoords],
  );
  const maniobra = useMemo(() => nextManeuver(rutaCoords, progreso), [rutaCoords, progreso]);

  // Estado "vivo" para efectos que no deben re-suscribirse en cada render.
  const live = {
    municipioId,
    placa,
    destino,
    rutaCoords,
    navegando,
    prefs,
    camaras,
    tipoSel,
    resultado,
  };
  const liveRef = useRef(live);
  liveRef.current = live;

  /* ------------------------------ Mapa base ------------------------------ */

  useEffect(() => {
    consultaService
      .getMunicipios()
      .then((m: MunicipioAPI[]) => {
        setMunicipios(m);
        if (m.length) setMunicipioId((prev) => (m.some((x) => x.id === prev) ? prev : m[0].id));
      })
      .catch((err) => setError(apiErrorMessage(err, 'No se pudieron cargar los municipios')));
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const center = CITY_CENTER[municipioId] || [-74.08, 4.65];
    const map = new maplibregl.Map({
      container: containerRef.current,
      // Estilo con sprite completo; liberty a veces pide iconos ausentes
      style: 'https://tiles.openfreemap.org/styles/bright',
      center,
      zoom: 11,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    // Evita spam de "Image X could not be loaded" si el estilo pide iconos faltantes
    const missing = new Set<string>();
    map.on('styleimagemissing', (e) => {
      const id = e.id;
      if (!id || missing.has(id) || map.hasImage(id)) return;
      missing.add(id);
      map.addImage(id, { width: 1, height: 1, data: new Uint8Array([0, 0, 0, 0]) }, { pixelRatio: 1 });
    });
    map.on('load', () => {
      initLayers(map);
      setMapReady(true);
    });
    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      const mode = clickModeRef.current;
      if (mode === 'origen') {
        setOrigen({ lat, lon: lng });
        clickModeRef.current = 'destino';
        setClickMode('destino');
      } else if (mode === 'destino') {
        setDestino({ lat, lon: lng });
        clickModeRef.current = null;
        setClickMode(null);
      }
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cambio de municipio: centra y recarga zonas / cámaras (semáforos solo si la capa está activa).
  useEffect(() => {
    const c = CITY_CENTER[municipioId];
    if (c && mapRef.current) mapRef.current.flyTo({ center: c, zoom: 11 });
    let cancelled = false;
    Promise.all([rutasService.zonas(municipioId), rutasService.camaras(municipioId)])
      .then(([z, c2]) => {
        if (cancelled) return;
        setZonas(z);
        setCamaras(c2);
      })
      .catch(() => {
        /* capas opcionales */
      });
    return () => {
      cancelled = true;
    };
  }, [municipioId]);

  useEffect(() => {
    if (!showSemaforos) return;
    const ctrl = new AbortController();
    rutasService
      .listSemaforos(municipioId, { signal: ctrl.signal })
      .then(setSemaforos)
      .catch(() => setSemaforos([]));
    return () => ctrl.abort();
  }, [showSemaforos, municipioId]);

  /* ------------------------------ Capas ------------------------------ */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    setData(map, 'zonas', {
      type: 'FeatureCollection',
      features: zonas.map((z) => ({
        type: 'Feature',
        properties: { nombre: z.nombre },
        geometry: { type: 'Polygon', coordinates: [z.geometria] },
      })),
    });
  }, [zonas, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    setData(map, 'camaras', {
      type: 'FeatureCollection',
      features: camaras.map((c) => ({
        type: 'Feature',
        properties: { nombre: c.nombre },
        geometry: { type: 'Point', coordinates: [c.lon, c.lat] },
      })),
    });
  }, [camaras, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    setData(map, 'semaforos', {
      type: 'FeatureCollection',
      features: semaforos.map((s) => ({
        type: 'Feature',
        properties: { nombre: s.nombre ?? '' },
        geometry: { type: 'Point', coordinates: [s.lon, s.lat] },
      })),
    });
  }, [semaforos, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    setVisible(map, 'zonas-fill', showZonas);
    setVisible(map, 'zonas-line', showZonas);
    setVisible(map, 'camaras-circle', showCamaras);
    setVisible(map, 'semaforos-circle', showSemaforos);
  }, [showZonas, showCamaras, showSemaforos, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const paint = (id: string, tipo: TipoRuta) => {
      const opcion = resultado?.rutas.find((r) => r.tipo === tipo);
      setData(map, id, {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: opcion?.viable ? opcion.geometria.coordinates : [],
        },
      });
      const activa = rutaActiva?.tipo === tipo;
      if (map.getLayer(`${id}-line`)) {
        map.setPaintProperty(`${id}-line`, 'line-width', activa ? 7 : 4);
        map.setPaintProperty(`${id}-line`, 'line-opacity', activa ? 0.95 : 0.55);
      }
    };
    paint('ruta-directa', 'directa');
    paint('ruta-alternativa', 'alternativa');
  }, [resultado, rutaActiva, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (origen) {
      if (!origenMarker.current) {
        origenMarker.current = new maplibregl.Marker({ color: '#0f766e' }).setLngLat([origen.lon, origen.lat]).addTo(map);
      } else {
        origenMarker.current.setLngLat([origen.lon, origen.lat]);
      }
    }
    if (destino) {
      if (!destinoMarker.current) {
        destinoMarker.current = new maplibregl.Marker({ color: '#b91c1c' }).setLngLat([destino.lon, destino.lat]).addTo(map);
      } else {
        destinoMarker.current.setLngLat([destino.lon, destino.lat]);
      }
    }
  }, [origen, destino, mapReady]);

  /* --------------------------- Utilidades de aviso --------------------------- */

  const updatePrefs = (patch: Partial<NavPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        /* almacenamiento no disponible */
      }
      return next;
    });
  };

  const beep = () => {
    const ctx = audioRef.current;
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      /* audio no disponible */
    }
  };

  const notifyCamera = () => {
    const p = liveRef.current.prefs;
    if (p.sonido) beep();
    if (p.vibracion && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([120, 60, 120]);
    }
  };

  /* ------------------------------ Cálculo de rutas ------------------------------ */

  const fitRoutes = (data: RutaResponse) => {
    const map = mapRef.current;
    if (!map) return;
    const coords = data.rutas.filter((r) => r.viable).flatMap((r) => r.geometria.coordinates);
    if (coords.length < 2) return;
    const bounds = coords.reduce(
      (b, c) => b.extend(c as [number, number]),
      new maplibregl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number]),
    );
    map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 800 });
  };

  const defaultTipo = (data: RutaResponse): TipoRuta =>
    data.rutas.some((r) => r.tipo === 'alternativa' && r.viable) && data.restringido ? 'alternativa' : 'directa';

  const calcular = async () => {
    if (!origen || !destino) {
      setError('Marca origen y destino en el mapa (clic).');
      return;
    }
    reqAbortRef.current?.abort();
    const ctrl = new AbortController();
    reqAbortRef.current = ctrl;
    setLoading(true);
    setRecalculando(false);
    setError(null);
    try {
      const data = await rutasService.calcularRuta(
        {
          origen_lat: origen.lat,
          origen_lon: origen.lon,
          destino_lat: destino.lat,
          destino_lon: destino.lon,
          municipio_id: municipioId,
          placa: placa || undefined,
          hora_salida: horaSalida ? new Date(horaSalida).toISOString() : undefined,
        },
        { signal: ctrl.signal },
      );
      setResultado(data);
      setTipoSel(defaultTipo(data));
      setLlegada(false);
      fitRoutes(data);
    } catch (err) {
      if (!isAbortError(err)) setError(apiErrorMessage(err, 'No se pudo calcular la ruta'));
    } finally {
      if (reqAbortRef.current === ctrl) {
        reqAbortRef.current = null;
        setLoading(false);
      }
    }
  };

  /** Recalcula desde la posición actual con rumbo; mismos municipio y placa. */
  const recalcular = async (from: GpsFix) => {
    const l = liveRef.current;
    if (!l.destino) return;
    reqAbortRef.current?.abort();
    const ctrl = new AbortController();
    reqAbortRef.current = ctrl;
    lastRecalcRef.current = Date.now();
    setRecalculando(true);
    setError(null);
    try {
      const data = await rutasService.recalcularRuta(
        {
          origen_lat: from.lat,
          origen_lon: from.lon,
          destino_lat: l.destino.lat,
          destino_lon: l.destino.lon,
          municipio_id: l.municipioId,
          placa: l.placa || undefined,
          hora_salida: new Date().toISOString(),
          heading: from.heading != null ? Math.min(359.9, Math.max(0, from.heading)) : undefined,
        },
        ctrl.signal,
      );
      if (ctrl.signal.aborted) return;
      setResultado(data);
      if (!data.rutas.some((r) => r.tipo === l.tipoSel && r.viable)) setTipoSel(defaultTipo(data));
      detectorRef.current.reset();
      lastRecalcRef.current = Date.now();
    } catch (err) {
      if (!isAbortError(err)) setError(apiErrorMessage(err, 'No se pudo recalcular la ruta'));
    } finally {
      if (reqAbortRef.current === ctrl) {
        reqAbortRef.current = null;
        setRecalculando(false);
      }
    }
  };

  /* ------------------------- Reacción a cada fix GPS ------------------------- */

  useEffect(() => {
    if (!fix) return;
    const map = mapRef.current;
    const l = liveRef.current;

    // Origen desde "Mi ubicación"
    if (buscandoOrigen) {
      setOrigen({ lat: fix.lat, lon: fix.lon });
      clickModeRef.current = 'destino';
      setClickMode('destino');
      setBuscandoOrigen(false);
      map?.flyTo({ center: [fix.lon, fix.lat], zoom: 14 });
    }
    if (!l.navegando) return;

    // Traza para map matching (se omiten puntos casi idénticos)
    const trace = traceRef.current;
    const last = trace[trace.length - 1];
    if (!last || haversineM(last, fix) >= MATCH_MIN_STEP_M) {
      trace.push({ lat: fix.lat, lon: fix.lon });
      if (trace.length > MATCH_MAX_POINTS) trace.shift();
    }

    // Llegada
    const dest = l.destino;
    if (dest && haversineM(fix, dest) <= ARRIVAL_M) {
      setLlegada(true);
      setNavegando(false);
      return;
    }

    // Fuera de ruta: 3 lecturas seguidas > 40 m (ajustado por accuracy) + cooldown
    const off = detectorRef.current.update(fix, fix.accuracy, l.rutaCoords);
    if (off && Date.now() - lastRecalcRef.current >= RECALC_COOLDOWN_MS) {
      void recalcular(fix);
    }

    // Map matching con throttling
    const now = Date.now();
    if (
      trace.length >= 2 &&
      matchFailuresRef.current < MATCH_MAX_FAILURES &&
      now - lastMatchRef.current >= MATCH_INTERVAL_MS
    ) {
      lastMatchRef.current = now;
      matchAbortRef.current?.abort();
      const ctrl = new AbortController();
      matchAbortRef.current = ctrl;
      rutasService
        .matchTrace([...trace], l.municipioId, { signal: ctrl.signal })
        .then((m) => {
          matchFailuresRef.current = 0;
          const lastPt = m.viable ? m.matched[m.matched.length - 1] : undefined;
          if (lastPt) snappedRef.current = { pt: lastPt, at: Date.now() };
        })
        .catch((err) => {
          if (!isAbortError(err)) matchFailuresRef.current += 1;
        });
    }

    // Marcador: posición pegada a la vía si es reciente y coherente con el fix
    const snap = snappedRef.current;
    const shown =
      snap && Date.now() - snap.at < 10000 && haversineM(snap.pt, fix) <= 25 ? snap.pt : { lat: fix.lat, lon: fix.lon };
    if (map) {
      if (!posMarker.current) {
        posMarker.current = new maplibregl.Marker({
          element: createPositionElement(),
          rotationAlignment: 'map',
          pitchAlignment: 'map',
        })
          .setLngLat([shown.lon, shown.lat])
          .addTo(map);
      } else {
        posMarker.current.setLngLat([shown.lon, shown.lat]);
      }
      if (fix.heading != null) posMarker.current.setRotation(fix.heading);
      if (l.prefs.seguir) {
        map.easeTo({ center: [shown.lon, shown.lat], duration: 600, bearing: fix.heading ?? map.getBearing() });
      }
    }

    // Aviso informativo de cámaras por delante (< 300 m en el rumbo)
    if (l.prefs.alertaCamaras) {
      const ahead = camerasAhead(fix, fix.heading, l.camaras);
      const alerted = alertedRef.current;
      let fresh = false;
      for (const a of ahead) {
        if (!alerted.has(a.camera.id)) {
          alerted.add(a.camera.id);
          fresh = true;
        }
      }
      // Rearme cuando ya quedó lejos
      l.camaras.forEach((c) => {
        if (alerted.has(c.id) && haversineM(fix, c) > CAMERA_REARM_M) alerted.delete(c.id);
      });
      if (ahead.length) {
        setCamaraAviso({ nombre: ahead[0].camera.nombre, distanciaM: ahead[0].distanceM });
        if (fresh) notifyCamera();
      } else {
        setCamaraAviso(null);
      }
    } else {
      setCamaraAviso(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fix]);

  // Errores del GPS como única fuente de posición
  useEffect(() => {
    if (gps.status === 'denied' || gps.status === 'unavailable') {
      setError(gps.error || 'No se pudo obtener tu ubicación');
      setBuscandoOrigen(false);
      setNavegando(false);
    }
  }, [gps.status, gps.error]);

  // Al detener GPS se limpia el marcador de posición
  useEffect(() => {
    if (!navegando) {
      posMarker.current?.remove();
      posMarker.current = null;
    }
  }, [navegando]);

  useEffect(
    () => () => {
      reqAbortRef.current?.abort();
      matchAbortRef.current?.abort();
      audioRef.current?.close().catch(() => undefined);
    },
    [],
  );

  /* ------------------------------ Acciones UI ------------------------------ */

  const iniciarNavegacion = () => {
    if (!rutaActiva) return;
    if (prefs.sonido && !audioRef.current && typeof window !== 'undefined') {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) audioRef.current = new Ctor();
    }
    audioRef.current?.resume().catch(() => undefined);
    detectorRef.current.reset();
    traceRef.current = [];
    snappedRef.current = null;
    alertedRef.current.clear();
    matchFailuresRef.current = 0;
    lastMatchRef.current = 0;
    lastRecalcRef.current = Date.now();
    setLlegada(false);
    setCamaraAviso(null);
    setError(null);
    setNavegando(true);
  };

  const detenerNavegacion = () => {
    reqAbortRef.current?.abort();
    matchAbortRef.current?.abort();
    setRecalculando(false);
    setNavegando(false);
    setCamaraAviso(null);
    mapRef.current?.easeTo({ bearing: 0, pitch: 0 });
  };

  const usarMiUbicacion = () => {
    setError(null);
    if (fix && navegando) {
      setOrigen({ lat: fix.lat, lon: fix.lon });
      return;
    }
    setBuscandoOrigen(true);
  };

  const buscarDireccion = async () => {
    if (geoQ.trim().length < 3) return;
    try {
      setGeoHits(await rutasService.geocodificar(`${geoQ}, Colombia`));
    } catch {
      setGeoHits([]);
    }
  };

  const etaZona = resultado?.eta_entrada_zona ? new Date(resultado.eta_entrada_zona) : null;
  const restanteMin =
    rutaActiva && progreso ? Math.max(1, Math.round(rutaActiva.duracion_min * (1 - progreso.fraction))) : null;

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-4 min-h-[70vh]">
      <aside className="space-y-4 order-2 lg:order-1">
        <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm space-y-3">
          <h2 className="font-semibold text-primary-800">Navegación MainV2</h2>
          <p className="text-sm text-ink-500">
            Marca origen y destino <strong>dentro de la misma ciudad</strong>. La directa sigue vías reales
            (Valhalla); la alternativa rodea el polígono de Pico y Placa por corredores laterales con
            validación geométrica densa. Durante la navegación se recalcula si te desvías.
          </p>

          <label className="block text-sm">
            Municipio
            <select
              className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2"
              value={municipioId}
              onChange={(e) => setMunicipioId(Number(e.target.value))}
            >
              {municipios.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            Placa
            <input
              className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 uppercase"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="ABC123"
            />
          </label>

          <label className="block text-sm">
            Hora de salida <span className="text-ink-400">(opcional)</span>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2"
              value={horaSalida}
              onChange={(e) => setHoraSalida(e.target.value)}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg text-sm ${clickMode === 'origen' ? 'bg-primary-700 text-white' : 'bg-ink-100'}`}
              onClick={() => {
                clickModeRef.current = 'origen';
                setClickMode('origen');
              }}
            >
              Marcar origen
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg text-sm ${clickMode === 'destino' ? 'bg-primary-700 text-white' : 'bg-ink-100'}`}
              onClick={() => {
                clickModeRef.current = 'destino';
                setClickMode('destino');
              }}
            >
              Marcar destino
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-sm bg-ink-100 disabled:opacity-60"
              disabled={buscandoOrigen}
              onClick={usarMiUbicacion}
            >
              {buscandoOrigen ? 'Buscando GPS…' : 'Mi ubicación'}
            </button>
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-ink-200 px-3 py-2 text-sm"
              placeholder="Buscar dirección (Nominatim)"
              value={geoQ}
              onChange={(e) => setGeoQ(e.target.value)}
            />
            <button type="button" className="px-3 py-2 rounded-lg bg-ink-100 text-sm" onClick={buscarDireccion}>
              Buscar
            </button>
          </div>
          {geoHits.length > 0 && (
            <ul className="max-h-32 overflow-auto text-xs space-y-1">
              {geoHits.map((h) => (
                <li key={`${h.lat}-${h.lon}`}>
                  <button
                    type="button"
                    className="text-left w-full hover:bg-ink-50 rounded px-1 py-0.5"
                    onClick={() => {
                      if (!origen) setOrigen({ lat: h.lat, lon: h.lon });
                      else setDestino({ lat: h.lat, lon: h.lon });
                      mapRef.current?.flyTo({ center: [h.lon, h.lat], zoom: 13 });
                    }}
                  >
                    {h.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <fieldset className="space-y-1">
            <legend className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Capas</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showZonas} onChange={(e) => setShowZonas(e.target.checked)} />
              Zona restringida
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showCamaras} onChange={(e) => setShowCamaras(e.target.checked)} />
              Cámaras (informativo)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showSemaforos} onChange={(e) => setShowSemaforos(e.target.checked)} />
              Semáforos (zoom ≥ 12)
            </label>
          </fieldset>

          <fieldset className="space-y-1">
            <legend className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
              Avisos en ruta
            </legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={prefs.alertaCamaras}
                onChange={(e) => updatePrefs({ alertaCamaras: e.target.checked })}
              />
              Aviso visual de cámaras a menos de {CAMERA_ALERT_RADIUS_M} m
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={prefs.sonido} onChange={(e) => updatePrefs({ sonido: e.target.checked })} />
              Sonido suave
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={prefs.vibracion}
                onChange={(e) => updatePrefs({ vibracion: e.target.checked })}
              />
              Vibración
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={prefs.seguir} onChange={(e) => updatePrefs({ seguir: e.target.checked })} />
              Seguir mi posición en el mapa
            </label>
          </fieldset>

          <button
            type="button"
            disabled={loading}
            onClick={calcular}
            className="w-full rounded-xl bg-primary-700 text-white py-2.5 font-medium disabled:opacity-60"
          >
            {loading ? 'Calculando…' : 'Calcular rutas'}
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {resultado && (
          <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm space-y-3">
            <p className={`text-sm font-medium ${resultado.restringido ? 'text-red-700' : 'text-emerald-700'}`}>
              {resultado.mensaje_restriccion}
            </p>
            {etaZona && (
              <p className="text-xs text-ink-600">
                Llegada estimada a la zona:{' '}
                {etaZona.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                {resultado.restriccion_en_eta != null &&
                  (resultado.restriccion_en_eta
                    ? ' · la restricción aplicaría a esa hora'
                    : ' · sin restricción a esa hora')}
              </p>
            )}
            {resultado.diferencia_min != null && (
              <p className="text-xs text-ink-500">
                Diferencia alternativa vs directa: ~{resultado.diferencia_min} min
              </p>
            )}
            {resultado.rutas.map((r) => {
              const seleccionada = rutaActiva?.tipo === r.tipo;
              return (
                <button
                  type="button"
                  key={r.tipo}
                  disabled={!r.viable || navegando}
                  onClick={() => setTipoSel(r.tipo as TipoRuta)}
                  className={`w-full text-left border-t border-ink-50 pt-2 text-sm rounded-lg px-1 ${seleccionada ? 'bg-primary-50' : ''} disabled:cursor-default`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ background: r.tipo === 'alternativa' ? '#0f766e' : '#64748b' }}
                    />
                    <strong className="capitalize">{r.tipo}</strong>
                    {seleccionada && r.viable && <span className="text-xs text-primary-700">seleccionada</span>}
                    {!r.viable && <span className="text-red-600 text-xs">no viable</span>}
                    {r.provider && <span className="ml-auto text-[10px] text-ink-400 uppercase">{r.provider}</span>}
                  </div>
                  <p className="text-ink-600">{r.mensaje}</p>
                  {r.viable && (
                    <p className="text-xs text-ink-500">
                      {(r.distancia_m / 1000).toFixed(1)} km · {r.duracion_min} min
                    </p>
                  )}
                </button>
              );
            })}

            {!navegando ? (
              <button
                type="button"
                disabled={!rutaActiva}
                onClick={iniciarNavegacion}
                className="w-full rounded-xl bg-emerald-700 text-white py-2.5 font-medium disabled:opacity-60"
              >
                Iniciar navegación con GPS
              </button>
            ) : (
              <button
                type="button"
                onClick={detenerNavegacion}
                className="w-full rounded-xl bg-red-700 text-white py-2.5 font-medium"
              >
                Detener navegación
              </button>
            )}
          </div>
        )}

        {navegando && (
          <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm space-y-2 text-sm">
            <h3 className="font-semibold text-primary-800">En ruta</h3>
            {!fix ? (
              <p className="text-ink-500">Esperando una señal GPS precisa…</p>
            ) : (
              <>
                {maniobra && (
                  <p className="text-base font-semibold text-ink-800">
                    {maneuverLabel(maniobra.kind)} · {formatDistance(maniobra.distanceM)}
                  </p>
                )}
                {rutaActiva?.mensaje && <p className="text-xs text-ink-500">{rutaActiva.mensaje}</p>}
                {progreso && (
                  <div>
                    <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all"
                        style={{ width: `${Math.round(progreso.fraction * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-ink-600">
                      {Math.round(progreso.fraction * 100)}% · faltan {formatDistance(progreso.remainingM)}
                      {restanteMin != null && ` · ~${restanteMin} min`}
                    </p>
                  </div>
                )}
                <p className="text-xs text-ink-400">
                  Precisión ±{Math.round(fix.accuracy ?? 0)} m
                  {fix.speed != null && ` · ${Math.round(fix.speed * 3.6)} km/h`}
                </p>
              </>
            )}
          </div>
        )}

        {llegada && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Has llegado a tu destino.
          </div>
        )}
      </aside>

      <div className="order-1 lg:order-2 relative rounded-2xl overflow-hidden border border-ink-100 shadow-sm min-h-[420px] h-[70vh]">
        <div ref={containerRef} className="w-full h-full" />

        {(recalculando || camaraAviso) && (
          <div className="pointer-events-none absolute top-3 left-3 right-14 space-y-2">
            {recalculando && (
              <div
                role="status"
                className="inline-flex items-center gap-2 rounded-full bg-primary-800/95 text-white text-sm px-3 py-1.5 shadow"
              >
                <span className="inline-block h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Recalculando ruta…
              </div>
            )}
            {camaraAviso && (
              <div role="alert" className="rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm px-3 py-2 shadow">
                <strong>Cámara de control de tránsito a ~{formatDistance(camaraAviso.distanciaM)}</strong>
                <span className="block text-xs">
                  {camaraAviso.nombre}. Aviso informativo de apoyo: conduce con precaución y respeta la
                  señalización y los límites de velocidad.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

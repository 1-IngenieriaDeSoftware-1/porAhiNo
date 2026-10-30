'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl, { GeoJSONSource, Map, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import consultaService from '@/services/consultaService';
import {
  CamaraAPI,
  RutaOpcion,
  RutaResponse,
  ZonaAPI,
  rutasService,
} from '@/services/rutasService';
import type { MunicipioAPI } from '@/types/api';
import { apiErrorMessage } from '@/lib/utils';

const CITY_CENTER: Record<number, [number, number]> = {
  1: [-74.08, 4.65],
  2: [-75.57, 6.24],
  3: [-76.53, 3.44],
};

type ClickMode = 'origen' | 'destino' | null;

export default function NavegacionMap() {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const origenMarker = useRef<Marker | null>(null);
  const destinoMarker = useRef<Marker | null>(null);

  const [municipios, setMunicipios] = useState<MunicipioAPI[]>([]);
  const [municipioId, setMunicipioId] = useState<number>(1);
  const [placa, setPlaca] = useState('ABC123');
  const [origen, setOrigen] = useState<{ lat: number; lon: number } | null>(null);
  const [destino, setDestino] = useState<{ lat: number; lon: number } | null>(null);
  const [clickMode, setClickMode] = useState<ClickMode>('origen');
  const clickModeRef = useRef<ClickMode>('origen');
  const [resultado, setResultado] = useState<RutaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoQ, setGeoQ] = useState('');
  const [geoHits, setGeoHits] = useState<{ display_name: string; lat: number; lon: number }[]>([]);
  const [showCamaras, setShowCamaras] = useState(true);
  const [showZonas, setShowZonas] = useState(true);

  const paintLayers = useCallback(
    (zonas: ZonaAPI[], camaras: CamaraAPI[], rutas?: RutaOpcion[]) => {
      const map = mapRef.current;
      if (!map) return;

      const zonaFc = {
        type: 'FeatureCollection' as const,
        features: zonas.map((z) => ({
          type: 'Feature' as const,
          properties: { nombre: z.nombre },
          geometry: { type: 'Polygon' as const, coordinates: [z.geometria] },
        })),
      };
      if (map.getSource('zonas')) {
        (map.getSource('zonas') as GeoJSONSource).setData(zonaFc);
      } else {
        map.addSource('zonas', { type: 'geojson', data: zonaFc });
        map.addLayer({
          id: 'zonas-fill',
          type: 'fill',
          source: 'zonas',
          paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.25 },
        });
        map.addLayer({
          id: 'zonas-line',
          type: 'line',
          source: 'zonas',
          paint: { 'line-color': '#b91c1c', 'line-width': 2 },
        });
      }
      map.setLayoutProperty('zonas-fill', 'visibility', showZonas ? 'visible' : 'none');
      map.setLayoutProperty('zonas-line', 'visibility', showZonas ? 'visible' : 'none');

      const camFc = {
        type: 'FeatureCollection' as const,
        features: camaras.map((c) => ({
          type: 'Feature' as const,
          properties: { nombre: c.nombre },
          geometry: { type: 'Point' as const, coordinates: [c.lon, c.lat] },
        })),
      };
      if (map.getSource('camaras')) {
        (map.getSource('camaras') as GeoJSONSource).setData(camFc);
      } else {
        map.addSource('camaras', { type: 'geojson', data: camFc });
        map.addLayer({
          id: 'camaras-circle',
          type: 'circle',
          source: 'camaras',
          paint: {
            'circle-radius': 7,
            'circle-color': '#f59e0b',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        });
      }
      map.setLayoutProperty('camaras-circle', 'visibility', showCamaras ? 'visible' : 'none');

      const addRoute = (id: string, color: string, opcion?: RutaOpcion) => {
        const data = {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: opcion?.viable ? opcion.geometria.coordinates : [],
          },
        };
        if (map.getSource(id)) {
          (map.getSource(id) as GeoJSONSource).setData(data);
        } else {
          map.addSource(id, { type: 'geojson', data });
          map.addLayer({
            id: `${id}-line`,
            type: 'line',
            source: id,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': color, 'line-width': 5, 'line-opacity': 0.85 },
          });
        }
      };

      const directa = rutas?.find((r) => r.tipo === 'directa');
      const alt = rutas?.find((r) => r.tipo === 'alternativa');
      addRoute('ruta-directa', '#64748b', directa);
      addRoute('ruta-alternativa', '#0f766e', alt);
    },
    [showCamaras, showZonas],
  );

  const loadCapas = useCallback(async () => {
    try {
      const [zonas, camaras] = await Promise.all([
        rutasService.zonas(municipioId),
        rutasService.camaras(municipioId),
      ]);
      paintLayers(zonas, camaras, resultado?.rutas);
    } catch {
      /* capas opcionales */
    }
  }, [municipioId, paintLayers, resultado?.rutas]);

  useEffect(() => {
    let cancelled = false;
    consultaService
      .getMunicipios()
      .then((m: MunicipioAPI[]) => {
        if (cancelled) return;
        setMunicipios(m);
        if (m.length) {
          setMunicipioId((prev) => (m.some((x) => x.id === prev) ? prev : m[0].id));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(apiErrorMessage(err, 'No se pudieron cargar los municipios'));
        }
      });
    return () => {
      cancelled = true;
    };
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
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right',
    );
    // Evita spam de "Image X could not be loaded" si el estilo pide iconos faltantes
    const missing = new Set<string>();
    map.on('styleimagemissing', (e) => {
      const id = e.id;
      if (!id || missing.has(id) || map.hasImage(id)) return;
      missing.add(id);
      const data = new Uint8Array([0, 0, 0, 0]);
      map.addImage(id, { width: 1, height: 1, data }, { pixelRatio: 1 });
    });
    map.on('load', () => {
      loadCapas();
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const c = CITY_CENTER[municipioId];
    if (c) map.flyTo({ center: c, zoom: 11 });
    loadCapas();
  }, [municipioId, loadCapas]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (origen) {
      if (!origenMarker.current) {
        origenMarker.current = new maplibregl.Marker({ color: '#0f766e' })
          .setLngLat([origen.lon, origen.lat])
          .addTo(map);
      } else {
        origenMarker.current.setLngLat([origen.lon, origen.lat]);
      }
    }
    if (destino) {
      if (!destinoMarker.current) {
        destinoMarker.current = new maplibregl.Marker({ color: '#b91c1c' })
          .setLngLat([destino.lon, destino.lat])
          .addTo(map);
      } else {
        destinoMarker.current.setLngLat([destino.lon, destino.lat]);
      }
    }
  }, [origen, destino]);

  useEffect(() => {
    loadCapas();
  }, [showCamaras, showZonas, loadCapas]);

  const calcular = async () => {
    if (!origen || !destino) {
      setError('Marca origen y destino en el mapa (clic).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await rutasService.calcular({
        origen_lat: origen.lat,
        origen_lon: origen.lon,
        destino_lat: destino.lat,
        destino_lon: destino.lon,
        municipio_id: municipioId,
        placa: placa || undefined,
      });
      setResultado(data);
      const [zonas, camaras] = await Promise.all([
        rutasService.zonas(municipioId),
        rutasService.camaras(municipioId),
      ]);
      paintLayers(zonas, camaras, data.rutas);
      const map = mapRef.current;
      if (map) {
        const allCoords = data.rutas
          .filter((r) => r.viable)
          .flatMap((r) => r.geometria.coordinates);
        if (allCoords.length >= 2) {
          const bounds = allCoords.reduce(
            (b, c) => b.extend(c as [number, number]),
            new maplibregl.LngLatBounds(
              allCoords[0] as [number, number],
              allCoords[0] as [number, number],
            ),
          );
          map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 800 });
        }
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo calcular la ruta'));
    } finally {
      setLoading(false);
    }
  };

  const buscarDireccion = async () => {
    if (geoQ.trim().length < 3) return;
    try {
      const hits = await rutasService.geocodificar(`${geoQ}, Colombia`);
      setGeoHits(hits);
    } catch {
      setGeoHits([]);
    }
  };

  const aplicarOrigenGps = (lat: number, lon: number) => {
    setOrigen({ lat, lon });
    setClickMode('destino');
    clickModeRef.current = 'destino';
    mapRef.current?.flyTo({ center: [lon, lat], zoom: 13 });
  };

  const usarMiUbicacion = async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Geolocation } = await import('@capacitor/geolocation');
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        aplicarOrigenGps(pos.coords.latitude, pos.coords.longitude);
        return;
      }
    } catch {
      /* cae a Geolocation web */
    }
    if (!navigator.geolocation) {
      setError('Geolocalización no disponible');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => aplicarOrigenGps(pos.coords.latitude, pos.coords.longitude),
      () => setError('No se pudo obtener tu ubicación'),
      { enableHighAccuracy: true },
    );
  };

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-4 min-h-[70vh]">
      <aside className="space-y-4 order-2 lg:order-1">
        <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm space-y-3">
          <h2 className="font-semibold text-primary-800">Navegación MainV2</h2>
          <p className="text-sm text-ink-500">
            Marca origen y destino <strong>dentro de la misma ciudad</strong>. La directa sigue
            vías reales (OSRM); la alternativa rodea el polígono de Pico y Placa por corredores
            laterales con validación geométrica densa.
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
            <button type="button" className="px-3 py-1.5 rounded-lg text-sm bg-ink-100" onClick={usarMiUbicacion}>
              Mi ubicación
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

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showZonas} onChange={(e) => setShowZonas(e.target.checked)} />
            Zona restringida
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showCamaras} onChange={(e) => setShowCamaras(e.target.checked)} />
            Cámaras (informativo)
          </label>

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
            {resultado.diferencia_min != null && (
              <p className="text-xs text-ink-500">
                Diferencia alternativa vs directa: ~{resultado.diferencia_min} min
              </p>
            )}
            {resultado.rutas.map((r) => (
              <div key={r.tipo} className="border-t border-ink-50 pt-2 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ background: r.tipo === 'alternativa' ? '#0f766e' : '#64748b' }}
                  />
                  <strong className="capitalize">{r.tipo}</strong>
                  {!r.viable && <span className="text-red-600 text-xs">no viable</span>}
                </div>
                <p className="text-ink-600">{r.mensaje}</p>
                {r.viable && (
                  <p className="text-xs text-ink-500">
                    {(r.distancia_m / 1000).toFixed(1)} km · {r.duracion_min} min
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </aside>

      <div className="order-1 lg:order-2 rounded-2xl overflow-hidden border border-ink-100 shadow-sm min-h-[420px] h-[70vh]">
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}

# CHANGELOG — Ruteo MainV2 (Valhalla / GPS / PyP temporal)

Fecha: 2026-11-01 · Rama PC/web: `MainV2` · Rama Android: `feat/android-app`

## Qué cambió

### 1. Motor de ruteo propio
- Interfaz `RoutingProvider` (`route` + `match`) con tipos Pydantic.
- **Principal:** `ValhallaProvider` (`exclude_polygons`, `exclude_locations`, `heading`, `trace_attributes`).
- **Fallback:** `GraphProvider` (Dijkstra local).
- **Eliminados** OSRM y OpenRouteService de la cadena (Nominatim se conserva).
- Docker Compose: servicio `valhalla` (PBF Colombia recortado al Valle de Aburrá, volumen persistente, healthcheck). Ver `docs/VALHALLA.md`.
- Cruce de zona: umbral **0%** (densificado + intersección).
- Desvío máximo: **1.8×** duración directa; si se excede → `viable=false` con mensaje claro (sin ruta engañosa).
- Bbox por municipio data-driven (`municipios.bbox_*`, migración `006_bbox_semaforos`). Medellín = Valle de Aburrá ampliado.

### 2. Pico y Placa dependiente del tiempo
- `RutaService` estima offset hasta entrada a zona, evalúa decretos en `hora_salida + offset`.
- Request acepta `hora_salida` (default: ahora America/Bogota).
- Respuesta: `hora_salida`, `eta_entrada_zona`, `restriccion_en_eta`.
- Solo pide alternativa con exclusión si la restricción aplica en ese instante.

### 3. GPS preciso (cliente)
- Hook `useGpsTracking` (Capacitor nativo / `navigator` web).
- Filtro accuracy > 40 m, saltos imposibles, Kalman 1D, heading por movimiento (>2 m/s).
- `POST /api/v1/rutas/match` + throttling en cliente.
- Android: fine/coarse location; background documentado con feature flag `NEXT_PUBLIC_GPS_BACKGROUND` (preparado, no forzado).

### 4. Recálculo dinámico
- Off-route: >40 m (ajustado por accuracy) × 3 lecturas.
- Recalcula con `heading`, cooldown ~8 s, `AbortController`, timeout Axios ~10 s.
- UI: “Recalculando”, progreso, próxima maniobra derivada de geometría.

### 5. Semáforos y cámaras
- Tabla `semaforos` + `GET /api/v1/rutas/semaforos` + capa mapa (toggle).
- Seed: `python -m scripts.seed_semaforos_osm` (Overpass `highway=traffic_signals`).
- Costing Valhalla con `maneuver_penalty` (sin fases inventadas). Interfaz `MobilityFeed` / `NullMobilityFeed` para feeds oficiales futuros.
- Alertas de fotomulta <300 m en rumbo: visual + sonido/vibración opcionales; tono informativo de apoyo.

## Decisiones técnicas

| Decisión | Motivo |
|----------|--------|
| Valhalla self-hosted vs ORS cloud | Determinismo, `exclude_polygons` sin cuota externa, latencia local |
| Cruce 0% | Evitar “alternativas” que rozan la zona |
| Desvío max 1.8× | Preferible `viable=false` a un desvío absurdo |
| PyP en ETA de zona | Evita desviar si la restricción ya no aplica al llegar |
| Sin fases de semáforo en vivo | No hay feed abierto fiable; no inventar datos |
| Rama Android = `feat/android-app` | No existe rama `mobile` en el remoto |

## Pendiente / follow-ups

- Primer build de tiles Valhalla en CI/demo (tiempo + disco).
- Plugin real de background geolocation si se activa el flag.
- Feed oficial AMVA/municipio cuando exista → implementar `MobilityFeed`.
- Maniobras Valhalla nativas (`maneuver` del trip) en lugar de heurística por geometría.
- Expandir grafo Dijkstra seed al bbox completo del Valle (hoy grid denso solo en zona centro).

## Cómo probar

```bash
# Infra
docker compose up -d db valhalla
cd backend && python -m scripts.migrate && python -m scripts.seed_mainv2
# opcional: python -m scripts.seed_semaforos_osm

# Checks
cd backend && ruff check app && pytest tests/test_routing_provider.py tests/test_ruta_temporal.py tests/test_rutas_match.py -q
cd frontend && npm test && npx tsc --noEmit && npx next lint && npm run build
# Android: CAPACITOR_BUILD=1 + cap sync (rama feat/android-app)

# Manual
uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev   # /navegacion
```

Variables clave: `VALHALLA_BASE_URL`, `ROUTING_MAX_DETOR_FACTOR`, `NEXT_PUBLIC_RECALC_TIMEOUT_MS`, `NEXT_PUBLIC_GPS_BACKGROUND`.

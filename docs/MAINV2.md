# MainV2 — Navegación con Pico y Placa (experimental)

Rama experimental **`MainV2`**. No se mergea a `main` hasta que el equipo lo decida. Rama Android: **`feat/android-app`**.

## Visión

App tipo GPS que conoce decretos de Pico y Placa. Si tu placa está restringida:

1. Calcula ruta **evitando la zona restringida** (Valhalla `exclude_polygons` + grafo local).
2. Evalúa la restricción a la **hora estimada de entrada a la zona** (no solo a la hora de la petición).
3. Muestra ruta “directa” vs “alternativa legal”; si no hay desvío razonable → `viable=false`.
4. Capa informativa de cámaras de fotomulta y semáforos OSM.
5. Aviso el día anterior vía Web Push.

## Motor de rutas

Ver [`docs/VALHALLA.md`](VALHALLA.md).

1. **`RoutingProvider`** (Protocol): `route` + `match`.
2. **Principal:** `ValhallaProvider` (`exclude_polygons`, `heading`, `trace_attributes`).
3. **Fallback:** `GraphProvider` (Dijkstra local).
4. **Cruce zona:** densificado + intersección, umbral **0%**.
5. **Desvío máximo:** `ROUTING_MAX_DETOR_FACTOR=1.8`; si se excede → alternativa no viable (mensaje claro).
6. **Bbox por municipio:** columnas `bbox_*` en `municipios` (Valle de Aburrá ampliado para Medellín).

OSRM y ORS **retirados** de la cadena. Nominatim se conserva para geocoding.

## Endpoints

- `POST /api/v1/rutas/` — calcular rutas (`hora_salida`, `heading` opcionales)
- `POST /api/v1/rutas/match` — map matching (traza corta)
- `GET /api/v1/rutas/zonas` — polígonos activos
- `GET /api/v1/rutas/camaras` — fotomultas (apoyo informativo)
- `GET /api/v1/rutas/semaforos` — nodos OSM traffic_signals
- `GET /api/v1/rutas/geocodificar?q=` — Nominatim
- `POST /api/v1/push/subscribe` — suscripción
- `POST /api/v1/push/avisos-manana` — avisos (admin/dev)

## Cómo probar

```bash
docker compose up -d db valhalla
cd backend && python -m scripts.migrate && python -m scripts.seed_mainv2
uvicorn app.main:app --reload --port 8000

cd frontend && npm install && npm run dev
# http://localhost:3000/navegacion
```

MapLibre solo dibuja lo que devuelve la API.

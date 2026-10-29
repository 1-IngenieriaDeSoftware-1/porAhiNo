# MainV2 — Navegación con Pico y Placa (experimental)

Rama experimental **`MainV2`**. No se mergea a `main` hasta que el equipo lo decida.

## Visión

App tipo GPS que conoce decretos de Pico y Placa. Si tu placa está restringida:

1. Calcula ruta **evitando la zona restringida** (grafo propio + Dijkstra).
2. Muestra ruta “directa” vs “alternativa legal”.
3. Capa informativa de cámaras de fotomulta (datos seed / abiertos).
4. Aviso el día anterior vía Web Push.

## Motor de rutas (decisión)

1. **Snap a calle** (OSRM nearest) + ruta OSRM con `alternatives`.
2. **Zonas centro densificadas** en `data/zonas_precision.json` v3 (no toda la ciudad: así se puede rodear).
3. **Cruce preciso:** densificado cada ~35 m + intersección segmento–polígono (umbral ~5% de vértices).
4. **Evitar zona:** alternativas nativas OSRM → ORS `avoid_polygons` (si `ORS_API_KEY`) → waypoints de **corredor flanco** (W/E u N/S) + buffer radial + OSRM (1–2 vias).
5. **Fallback:** Dijkstra local solo si OSRM/ORS no hallan desvío.

DB local Docker (`localhost:5432`) + `python -m scripts.seed_mainv2`. Mata uvicorn huérfanos si `/zonas` muestra polígonos de 5 puntos viejos.

Para máxima precisión de desvío: key gratis en https://openrouteservice.org → `ORS_API_KEY` en `.env`.

Origen/destino en el **mismo municipio**. MapLibre solo visualiza.

## APIs externas usadas

| Uso | Proveedor | Notas |
|-----|-----------|--------|
| Tiles del mapa | OpenFreeMap / OSM | Solo visualización en el cliente |
| Geocoding (opcional) | Nominatim | Texto → lat/lon; con rate-limit |
| Push | Web Push VAPID | Sin Firebase |

## Endpoints nuevos

- `POST /api/v1/rutas` — calcular rutas
- `GET /api/v1/rutas/zonas` — polígonos activos
- `GET /api/v1/rutas/camaras` — puntos de cámaras
- `GET /api/v1/rutas/geocodificar?q=` — geocoding
- `POST /api/v1/push/subscribe` — guardar suscripción
- `POST /api/v1/push/avisos-manana` — disparar avisos (admin/dev)

## Cómo probar

```bash
# Backend
cd backend && python -m scripts.migrate && python -m scripts.seed_mainv2
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
# Abrir http://localhost:3000/navegacion
```

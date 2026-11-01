# Valhalla — motor de ruteo propio (MainV2)

porAhiNo usa **Valhalla** detrás de `RoutingProvider`. OSRM y OpenRouteService ya no forman parte de la cadena.

## Arranque rápido (Valle de Aburrá)

```bash
# Descarga Colombia OSM, recorta al bbox del Valle de Aburrá y sirve tiles
docker compose up -d valhalla

# Health
curl -fsS http://127.0.0.1:8002/status
```

Variables relevantes (`docker-compose.yml` / `.env`):

| Variable | Default | Descripción |
|----------|---------|-------------|
| `VALHALLA_BASE_URL` | `http://127.0.0.1:8002` | URL que usa el backend |
| `VALHALLA_TIMEOUT_S` | `12` | Timeout HTTP al motor |
| `VALHALLA_TILE_URL` | Geofabrik Colombia | PBF de origen |
| `VALHALLA_BBOX` | `-75.75,6.05,-75.40,6.55` | Recorte Valle de Aburrá |

El volumen Docker `valhalla_data` persiste tiles construidos. El primer arranque puede tardar varios minutos.

## Colombia completa

Para tiles de todo el país (mucho más disco/RAM):

```bash
# Sin bounding_box (o bbox vacío) y force rebuild
VALHALLA_BBOX= docker compose run --rm \
  -e force_rebuild=True \
  -e bounding_box= \
  -e tile_urls=https://download.geofabrik.de/south-america/colombia-latest.osm.pbf \
  valhalla
```

Recomendación demo/local: quedarse con el recorte del Valle de Aburrá.

## Cómo se construyen los tiles (manual)

Si no usas la imagen `gis-ops/docker-valhalla`:

1. Descarga el PBF: [Geofabrik Colombia](https://download.geofabrik.de/south-america/colombia.html).
2. Recorta con `osmium extract -b -75.75,6.05,-75.40,6.55 colombia-latest.osm.pbf -o aburra.osm.pbf`.
3. Genera tiles con `valhalla_build_tiles -c valhalla.json aburra.osm.pbf`.
4. Sirve con `valhalla_service valhalla.json`.

## Cadena de ruteo

1. `ValhallaProvider.route` con `exclude_polygons` / `exclude_locations` / `heading`.
2. Si Valhalla cae → `GraphProvider` (Dijkstra local sobre nodos/aristas seed).
3. Verificación final de cruce de zona al **0%** (densificado + intersección).
4. Si el desvío supera `ROUTING_MAX_DETOR_FACTOR` (1.8×) → `viable=false` con mensaje claro.

Map matching: `POST /api/v1/rutas/match` → Valhalla `trace_attributes`.

Geocodificación sigue en **Nominatim** (sin cambios).

## Costing y semáforos

En `costing_options.auto` se aplica `maneuver_penalty` y costos de control para mejorar el ETA. **No** hay temporizadores de fase de semáforo (no existe feed abierto fiable). La capa `semaforos` es informativa y deja interfaz para datos oficiales futuros.

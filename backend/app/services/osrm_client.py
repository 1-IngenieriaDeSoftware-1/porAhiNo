"""
Rutas por vías de alta precisión (MainV2).

1) Snap a calle (OSRM nearest)
2) Ruta OSRM con alternatives
3) Validación de cruce con geometría densa (segmentos + buffer)
4) Desvío: waypoints en anillo buffer + ORS avoid_polygons si hay ORS_API_KEY
"""

from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from typing import Optional, Sequence

import httpx

from app.services.geo_precision import (
    buffer_ring_outward,
    corredor_flancos,
    densificar_polilinea,
    fraccion_dentro_zona,
    polilinea_cruza_zonas,
)
from app.services.routing_engine import ResultadoRuta, haversine_m

OSRM_BASE = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org")
ORS_BASE = os.getenv("ORS_BASE_URL", "https://api.openrouteservice.org")
# Umbral: si >5% de la polilínea cae en zona, se considera cruce significativo
# (calles que rozan el borde densificado no deben invalidar un desvío real)
CRUCE_FRAC_MAX = 0.05


@dataclass
class OsrmRoute:
    coordinates: list[list[float]]
    distancia_m: float
    duracion_s: float
    fuente: str = "osrm"


async def osrm_nearest(lat: float, lon: float, *, timeout: float = 10.0) -> tuple[float, float]:
    """Snap a la vía más cercana. Retorna (lat, lon)."""
    url = f"{OSRM_BASE}/nearest/v1/driving/{lon},{lat}"
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(url, params={"number": 1})
            if resp.status_code != 200:
                return lat, lon
            data = resp.json()
            waypoints = data.get("waypoints") or []
            if not waypoints:
                return lat, lon
            loc = waypoints[0].get("location")  # [lon, lat]
            if not loc or len(loc) < 2:
                return lat, lon
            return float(loc[1]), float(loc[0])
    except Exception:
        return lat, lon


async def osrm_routes(
    puntos: Sequence[tuple[float, float]],
    *,
    alternatives: bool = True,
    timeout: float = 25.0,
) -> list[OsrmRoute]:
    if len(puntos) < 2:
        return []
    coords = ";".join(f"{lon},{lat}" for lat, lon in puntos)
    url = f"{OSRM_BASE}/route/v1/driving/{coords}"
    params = {
        "overview": "full",
        "geometries": "geojson",
        "alternatives": "true" if alternatives and len(puntos) == 2 else "false",
        "steps": "false",
        "annotations": "false",
    }
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(url, params=params)
            if resp.status_code != 200:
                return []
            data = resp.json()
    except Exception:
        return []

    out: list[OsrmRoute] = []
    for best in data.get("routes") or []:
        geometry = best.get("geometry") or {}
        coordinates = geometry.get("coordinates") or []
        if len(coordinates) < 2:
            continue
        out.append(
            OsrmRoute(
                coordinates=coordinates,
                distancia_m=float(best.get("distance") or 0),
                duracion_s=float(best.get("duration") or 0),
                fuente="osrm",
            )
        )
    return out


async def osrm_route(
    puntos: Sequence[tuple[float, float]],
    *,
    timeout: float = 25.0,
) -> Optional[OsrmRoute]:
    routes = await osrm_routes(puntos, alternatives=False, timeout=timeout)
    return routes[0] if routes else None


def _cruza(coords: Sequence[Sequence[float]], zonas: Sequence[Sequence[Sequence[float]]]) -> bool:
    dense = densificar_polilinea(coords, max_step_m=35.0)
    if polilinea_cruza_zonas(dense, zonas):
        return True
    return fraccion_dentro_zona(dense, zonas) > CRUCE_FRAC_MAX


async def ors_route_avoid(
    origen_lat: float,
    origen_lon: float,
    destino_lat: float,
    destino_lon: float,
    zonas: Sequence[Sequence[Sequence[float]]],
) -> Optional[OsrmRoute]:
    """OpenRouteService Directions con avoid_polygons (requiere ORS_API_KEY)."""
    api_key = os.getenv("ORS_API_KEY", "").strip()
    if not api_key or not zonas:
        return None

    # ORS espera Polygon GeoJSON
    ring = list(zonas[0])
    if ring[0] != ring[-1]:
        ring = ring + [ring[0]]
    body = {
        "coordinates": [[origen_lon, origen_lat], [destino_lon, destino_lat]],
        "instructions": False,
        "geometry": True,
        "elevation": False,
        "options": {
            "avoid_polygons": {
                "type": "Polygon",
                "coordinates": [ring],
            }
        },
    }
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json, application/geo+json",
    }
    url = f"{ORS_BASE}/v2/directions/driving-car/geojson"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=body, headers=headers)
            if resp.status_code != 200:
                return None
            data = resp.json()
    except Exception:
        return None

    features = data.get("features") or []
    if not features:
        return None
    feat = features[0]
    coords = (feat.get("geometry") or {}).get("coordinates") or []
    props = feat.get("properties") or {}
    summary = props.get("summary") or {}
    if len(coords) < 2:
        return None
    return OsrmRoute(
        coordinates=coords,
        distancia_m=float(summary.get("distance") or props.get("distance") or 0),
        duracion_s=float(summary.get("duration") or props.get("duration") or 0),
        fuente="ors",
    )


def _waypoints_precision(
    origen_lat: float,
    origen_lon: float,
    destino_lat: float,
    destino_lon: float,
    zonas: Sequence[Sequence[Sequence[float]]],
) -> list[tuple[float, float]]:
    if not zonas:
        return []
    ring = zonas[0]
    from app.services.routing_engine import punto_en_poligono

    pts = [p for p in ring]
    if len(pts) >= 2 and pts[0] == pts[-1]:
        pts = pts[:-1]
    lons = [p[0] for p in pts]
    lats = [p[1] for p in pts]
    min_lon, max_lon = min(lons), max(lons)
    min_lat, max_lat = min(lats), max(lats)
    mid_zone_lat = (min_lat + max_lat) / 2
    mid_zone_lon = (min_lon + max_lon) / 2

    def _fuera_bbox_m(lat: float, lon: float) -> float:
        """Distancia mínima al borde del bbox (positiva = fuera)."""
        if min_lat <= lat <= max_lat and min_lon <= lon <= max_lon:
            return 0.0
        # clamp al bbox y medir
        clat = min(max(lat, min_lat), max_lat)
        clon = min(max(lon, min_lon), max_lon)
        return haversine_m(lat, lon, clat, clon)

    flancos = corredor_flancos(ring, origen_lat, origen_lon, destino_lat, destino_lon)
    # Prioriza flancos bien fuera del bbox y cerca del centro latitudinal de la zona
    flanco_scored = []
    for lat, lon in flancos:
        if punto_en_poligono(lon, lat, ring):
            continue
        fuera = _fuera_bbox_m(lat, lon)
        if fuera < 700:
            continue
        # Ideal: ~1.5–4 km fuera + lat cerca del centro de la zona
        score = abs(fuera - 2200) + 0.8 * abs(lat - mid_zone_lat) * 111_000
        flanco_scored.append((score, lat, lon))
    flanco_scored.sort(key=lambda x: x[0])

    picked: list[tuple[float, float]] = []
    for _, lat, lon in flanco_scored:
        if any(haversine_m(lat, lon, p[0], p[1]) < 400 for p in picked):
            continue
        picked.append((lat, lon))
        if len(picked) >= 12:
            break

    # Completar con buffer radial si faltan
    buffer_pts: list[tuple[float, float]] = []
    for meters in (1200, 2000, 2800, 3600):
        buffer_pts.extend(buffer_ring_outward(ring, meters=meters, samples=16))
    buf_scored = []
    for lat, lon in buffer_pts:
        if punto_en_poligono(lon, lat, ring):
            continue
        fuera = _fuera_bbox_m(lat, lon)
        if fuera < 500:
            continue
        d_mid = haversine_m(mid_zone_lat, mid_zone_lon, lat, lon)
        buf_scored.append((abs(fuera - 2000) + 0.3 * d_mid, lat, lon))
    buf_scored.sort(key=lambda x: x[0])
    for _, lat, lon in buf_scored:
        if any(haversine_m(lat, lon, p[0], p[1]) < 400 for p in picked):
            continue
        picked.append((lat, lon))
        if len(picked) >= 18:
            break
    return picked


def _pares_corredor(
    waypoints: Sequence[tuple[float, float]],
) -> list[tuple[tuple[float, float], tuple[float, float]]]:
    """Pares (norte, sur) del mismo flanco para desvío en 2 waypoints."""
    if len(waypoints) < 2:
        return []
    by_lon = sorted(waypoints, key=lambda p: p[1])
    oeste = by_lon[: max(3, len(by_lon) // 3)]
    este = by_lon[-max(3, len(by_lon) // 3) :]
    pares: list[tuple[tuple[float, float], tuple[float, float]]] = []
    for flanco in (oeste, este):
        orden = sorted(flanco, key=lambda p: p[0], reverse=True)
        if len(orden) >= 2:
            pares.append((orden[0], orden[-1]))
            if len(orden) >= 3:
                pares.append((orden[0], orden[len(orden) // 2]))
    return pares[:6]


async def ruta_por_vias(
    origen_lat: float,
    origen_lon: float,
    destino_lat: float,
    destino_lon: float,
    *,
    zonas_bloqueo: Sequence[Sequence[Sequence[float]]] | None = None,
    evita_restriccion: bool = False,
) -> ResultadoRuta:
    # Snap a red vial
    o_lat, o_lon = await osrm_nearest(origen_lat, origen_lon)
    d_lat, d_lon = await osrm_nearest(destino_lat, destino_lon)

    candidatas = await osrm_routes([(o_lat, o_lon), (d_lat, d_lon)], alternatives=True)
    if not candidatas:
        # un intento simple
        one = await osrm_route([(o_lat, o_lon), (d_lat, d_lon)])
        candidatas = [one] if one else []
    if not candidatas:
        return ResultadoRuta(
            [],
            [],
            0,
            0,
            evita_restriccion,
            False,
            "OSRM no disponible; no se pudo trazar por vías",
        )

    directa = min(candidatas, key=lambda r: r.duracion_s)
    zonas = list(zonas_bloqueo or [])

    if not evita_restriccion or not zonas:
        return ResultadoRuta(
            [],
            directa.coordinates,
            directa.distancia_m,
            directa.duracion_s,
            False,
            True,
            f"Ruta por vías ({directa.fuente}, snap a calle)",
        )

    # Si alguna alternativa OSRM nativa ya evita la zona, úsala
    sin_cruce = [r for r in candidatas if not _cruza(r.coordinates, zonas)]
    if sin_cruce:
        best = min(sin_cruce, key=lambda r: r.duracion_s)
        return ResultadoRuta(
            [],
            best.coordinates,
            best.distancia_m,
            best.duracion_s,
            True,
            True,
            f"Ruta por vías alternativa nativa ({best.fuente}) sin cruzar zona",
        )

    # ORS avoid_polygons (máxima precisión si hay key)
    ors = await ors_route_avoid(o_lat, o_lon, d_lat, d_lon, zonas)
    if ors and not _cruza(ors.coordinates, zonas):
        return ResultadoRuta(
            [],
            ors.coordinates,
            ors.distancia_m,
            ors.duracion_s,
            True,
            True,
            "Ruta por vías evitando polígono (OpenRouteService)",
        )

    # Waypoints: flancos + buffer; 1 y 2 vias intermedias
    wps_raw = _waypoints_precision(o_lat, o_lon, d_lat, d_lon, zonas)
    snapped = await asyncio.gather(*(osrm_nearest(lat, lon) for lat, lon in wps_raw))
    wps = list(dict.fromkeys(snapped))  # dedup preservando orden

    sem = asyncio.Semaphore(5)
    directa_frac = fraccion_dentro_zona(
        densificar_polilinea(directa.coordinates, 35.0), zonas
    )

    async def _evaluar(
        puntos: Sequence[tuple[float, float]],
    ) -> tuple[Optional[OsrmRoute], float]:
        async with sem:
            alt = await osrm_route(puntos)
        if alt is None or alt.duracion_s > directa.duracion_s * 3.5:
            return None, 1.0
        frac = fraccion_dentro_zona(densificar_polilinea(alt.coordinates, 35.0), zonas)
        return alt, frac

    tareas = [_evaluar([(o_lat, o_lon), wp, (d_lat, d_lon)]) for wp in wps]
    for a, b in _pares_corredor(wps):
        tareas.append(_evaluar([(o_lat, o_lon), a, b, (d_lat, d_lon)]))

    resultados = await asyncio.gather(*tareas)
    limpios = [(r, f) for r, f in resultados if r is not None and f <= CRUCE_FRAC_MAX]
    if limpios:
        best, _ = min(limpios, key=lambda x: x[0].duracion_s)
        return ResultadoRuta(
            [],
            best.coordinates,
            best.distancia_m,
            best.duracion_s,
            True,
            True,
            "Ruta alternativa por vías (corredor + OSRM) evitando zona de Pico y Placa",
        )

    # Mejor esfuerzo: reduce mucho el cruce aunque roce el borde (calles forzosas)
    esfuerzo = [
        (r, f)
        for r, f in resultados
        if r is not None and f < max(0.12, directa_frac * 0.45)
    ]
    if esfuerzo:
        best, frac = min(esfuerzo, key=lambda x: (x[1], x[0].duracion_s))
        return ResultadoRuta(
            [],
            best.coordinates,
            best.distancia_m,
            best.duracion_s,
            True,
            True,
            f"Ruta alternativa por vías (corredor + OSRM), cruce residual {frac:.0%}",
        )

    return ResultadoRuta(
        [],
        [],
        0,
        0,
        True,
        False,
        "No se encontró desvío por vías con precisión suficiente que evite la zona",
    )

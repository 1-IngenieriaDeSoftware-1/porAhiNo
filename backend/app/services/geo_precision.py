"""
Geometría de alta precisión para MainV2:
- intersección segmento–polígono
- buffer radial de anillos
- muestreo denso de polilíneas
"""

from __future__ import annotations

import math
from typing import Sequence

from app.services.routing_engine import EARTH_RADIUS_M, punto_en_poligono, punto_en_alguna_zona


def _orient(ax: float, ay: float, bx: float, by: float, cx: float, cy: float) -> float:
    return (by - ay) * (cx - bx) - (bx - ax) * (cy - by)


def _on_segment(ax: float, ay: float, bx: float, by: float, cx: float, cy: float) -> bool:
    return (
        min(ax, bx) - 1e-12 <= cx <= max(ax, bx) + 1e-12
        and min(ay, by) - 1e-12 <= cy <= max(ay, by) + 1e-12
    )


def segmentos_intersectan(
    a1: Sequence[float],
    a2: Sequence[float],
    b1: Sequence[float],
    b2: Sequence[float],
) -> bool:
    """a/b = [lon, lat]."""
    o1 = _orient(a1[0], a1[1], a2[0], a2[1], b1[0], b1[1])
    o2 = _orient(a1[0], a1[1], a2[0], a2[1], b2[0], b2[1])
    o3 = _orient(b1[0], b1[1], b2[0], b2[1], a1[0], a1[1])
    o4 = _orient(b1[0], b1[1], b2[0], b2[1], a2[0], a2[1])
    if o1 * o2 < 0 and o3 * o4 < 0:
        return True
    if abs(o1) < 1e-12 and _on_segment(a1[0], a1[1], a2[0], a2[1], b1[0], b1[1]):
        return True
    if abs(o2) < 1e-12 and _on_segment(a1[0], a1[1], a2[0], a2[1], b2[0], b2[1]):
        return True
    if abs(o3) < 1e-12 and _on_segment(b1[0], b1[1], b2[0], b2[1], a1[0], a1[1]):
        return True
    if abs(o4) < 1e-12 and _on_segment(b1[0], b1[1], b2[0], b2[1], a2[0], a2[1]):
        return True
    return False


def polilinea_cruza_anillo(
    coords: Sequence[Sequence[float]],
    ring: Sequence[Sequence[float]],
) -> bool:
    """True si algún vértice está dentro o algún segmento cruza el borde."""
    if len(coords) < 2 or len(ring) < 3:
        return False
    pts = list(ring)
    if pts[0] != pts[-1]:
        pts = pts + [pts[0]]

    for p in coords:
        if punto_en_poligono(p[0], p[1], ring):
            return True

    for i in range(len(coords) - 1):
        a1, a2 = coords[i], coords[i + 1]
        for j in range(len(pts) - 1):
            if segmentos_intersectan(a1, a2, pts[j], pts[j + 1]):
                return True
    return False


def polilinea_cruza_zonas(
    coords: Sequence[Sequence[float]],
    zonas: Sequence[Sequence[Sequence[float]]],
) -> bool:
    return any(polilinea_cruza_anillo(coords, z) for z in zonas)


def densificar_polilinea(
    coords: Sequence[Sequence[float]],
    max_step_m: float = 40.0,
) -> list[list[float]]:
    """Inserta puntos cada ~max_step_m para no saltarse calles finas al validar zonas."""
    if len(coords) < 2:
        return [list(c) for c in coords]
    out: list[list[float]] = [list(coords[0])]
    for i in range(1, len(coords)):
        lon1, lat1 = coords[i - 1][0], coords[i - 1][1]
        lon2, lat2 = coords[i][0], coords[i][1]
        # distancia aproximada
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2) ** 2
        )
        dist = 2 * EARTH_RADIUS_M * math.asin(min(1.0, math.sqrt(a)))
        n = max(1, int(dist // max_step_m))
        for k in range(1, n + 1):
            t = k / n
            out.append([lon1 + (lon2 - lon1) * t, lat1 + (lat2 - lat1) * t])
    return out


def _destino_offset(lat: float, lon: float, bearing_deg: float, meters: float) -> tuple[float, float]:
    """Destino desde (lat,lon) a `meters` con rumbo degrees. Retorna (lat, lon)."""
    br = math.radians(bearing_deg)
    ang = meters / EARTH_RADIUS_M
    lat1 = math.radians(lat)
    lon1 = math.radians(lon)
    lat2 = math.asin(
        math.sin(lat1) * math.cos(ang) + math.cos(lat1) * math.sin(ang) * math.cos(br)
    )
    lon2 = lon1 + math.atan2(
        math.sin(br) * math.sin(ang) * math.cos(lat1),
        math.cos(ang) - math.sin(lat1) * math.sin(lat2),
    )
    return math.degrees(lat2), math.degrees(lon2)


def buffer_ring_outward(
    ring: Sequence[Sequence[float]],
    meters: float = 600.0,
    samples: int = 24,
) -> list[tuple[float, float]]:
    """
    Puntos (lat, lon) fuera del polígono: empuja cada vértice lejos del centroide
    y añade muestras extras en el anillo expandido.
    """
    pts = [p for p in ring]
    if len(pts) >= 2 and pts[0] == pts[-1]:
        pts = pts[:-1]
    if len(pts) < 3:
        return []

    cx = sum(p[0] for p in pts) / len(pts)
    cy = sum(p[1] for p in pts) / len(pts)
    out: list[tuple[float, float]] = []

    for lon, lat in pts:
        # rumbo desde centroide hacia el vértice
        dlon = math.radians(lon - cx)
        lat1 = math.radians(cy)
        lat2 = math.radians(lat)
        y = math.sin(dlon) * math.cos(lat2)
        x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
        bearing = (math.degrees(math.atan2(y, x)) + 360) % 360
        nlat, nlon = _destino_offset(lat, lon, bearing, meters)
        if not punto_en_poligono(nlon, nlat, ring):
            out.append((nlat, nlon))

    # muestras angulares extras alrededor del bbox expandido
    lons = [p[0] for p in pts]
    lats = [p[1] for p in pts]
    min_lon, max_lon = min(lons), max(lons)
    min_lat, max_lat = min(lats), max(lats)
    # radio aprox en metros del bbox
    diag = max(
        abs(max_lat - min_lat) * 111_000,
        abs(max_lon - min_lon) * 111_000 * math.cos(math.radians(cy)),
    )
    radius = diag / 2 + meters
    for i in range(samples):
        bearing = (360.0 / samples) * i
        nlat, nlon = _destino_offset(cy, cx, bearing, radius)
        if not punto_en_poligono(nlon, nlat, ring):
            out.append((nlat, nlon))

    return out


def corredor_flancos(
    ring: Sequence[Sequence[float]],
    origen_lat: float,
    origen_lon: float,
    destino_lat: float,
    destino_lon: float,
    *,
    offsets_m: Sequence[float] = (900, 1600, 2400, 3200),
    fracciones: Sequence[float] = (0.2, 0.35, 0.5, 0.65, 0.8),
) -> list[tuple[float, float]]:
    """
    Waypoints en flancos W/E (y N/S si el viaje es E-O) fuera del bbox de la zona.
    Fuerza corredores tipo Boyacá/NQS que el buffer radial suele omitir.
    """
    pts = [p for p in ring]
    if len(pts) >= 2 and pts[0] == pts[-1]:
        pts = pts[:-1]
    if len(pts) < 3:
        return []

    lons = [p[0] for p in pts]
    lats = [p[1] for p in pts]
    min_lon, max_lon = min(lons), max(lons)
    min_lat, max_lat = min(lats), max(lats)
    mid_lat = (min_lat + max_lat) / 2
    mid_lon = (min_lon + max_lon) / 2
    cos_lat = math.cos(math.radians(mid_lat)) or 1e-6

    # Eje dominante del viaje
    dlat = abs(destino_lat - origen_lat)
    dlon = abs(destino_lon - origen_lon) * cos_lat
    eje_ns = dlat >= dlon

    out: list[tuple[float, float]] = []
    for t in fracciones:
        lat = origen_lat + (destino_lat - origen_lat) * t
        lon = origen_lon + (destino_lon - origen_lon) * t
        # anclar lat/lon al tramo que cruza el bbox
        lat = min(max(lat, min_lat - 0.01), max_lat + 0.01)
        lon = min(max(lon, min_lon - 0.01), max_lon + 0.01)
        for meters in offsets_m:
            dlat_deg = meters / 111_000
            dlon_deg = meters / (111_000 * cos_lat)
            if eje_ns:
                candidatos = [
                    (lat, min_lon - dlon_deg),
                    (lat, max_lon + dlon_deg),
                    (mid_lat, min_lon - dlon_deg),
                    (mid_lat, max_lon + dlon_deg),
                ]
            else:
                candidatos = [
                    (min_lat - dlat_deg, lon),
                    (max_lat + dlat_deg, lon),
                    (min_lat - dlat_deg, mid_lon),
                    (max_lat + dlat_deg, mid_lon),
                ]
            for nlat, nlon in candidatos:
                if not punto_en_poligono(nlon, nlat, ring):
                    out.append((nlat, nlon))
    return out


def fraccion_dentro_zona(
    coords: Sequence[Sequence[float]],
    zonas: Sequence[Sequence[Sequence[float]]],
) -> float:
    """Proporción de vértices densificados dentro de alguna zona (0..1)."""
    dense = densificar_polilinea(coords, max_step_m=50.0)
    if not dense:
        return 0.0
    inside = sum(1 for p in dense if punto_en_alguna_zona(p[0], p[1], zonas))
    return inside / len(dense)

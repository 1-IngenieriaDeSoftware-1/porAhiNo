"""
Motor de rutas propio (MainV2).

- Distancia Haversine
- Punto-en-polígono (ray casting)
- Dijkstra sobre grafo de corredores urbanos
- Aristas dentro de zona restringida activa → costo infinito
"""

from __future__ import annotations

import heapq
import math
from dataclasses import dataclass
from typing import Iterable, Sequence


EARTH_RADIUS_M = 6_371_000.0
INF = float("inf")


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    rlat1, rlon1, rlat2, rlon2 = map(math.radians, (lat1, lon1, lat2, lon2))
    dlat = rlat2 - rlat1
    dlon = rlon2 - rlon1
    a = math.sin(dlat / 2) ** 2 + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlon / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def punto_en_poligono(lon: float, lat: float, ring: Sequence[Sequence[float]]) -> bool:
    """Ray casting. ring = [[lon, lat], ...] (GeoJSON order)."""
    if len(ring) < 3:
        return False
    pts = list(ring)
    if pts[0] != pts[-1]:
        pts = pts + [pts[0]]
    inside = False
    j = len(pts) - 1
    for i in range(len(pts)):
        xi, yi = pts[i][0], pts[i][1]
        xj, yj = pts[j][0], pts[j][1]
        intersect = ((yi > lat) != (yj > lat)) and (
            lon < (xj - xi) * (lat - yi) / ((yj - yi) or 1e-15) + xi
        )
        if intersect:
            inside = not inside
        j = i
    return inside


def punto_en_alguna_zona(lon: float, lat: float, zonas: Iterable[Sequence[Sequence[float]]]) -> bool:
    return any(punto_en_poligono(lon, lat, z) for z in zonas)


@dataclass(frozen=True)
class Nodo:
    id: int
    lat: float
    lon: float


@dataclass
class ResultadoRuta:
    nodo_ids: list[int]
    coordenadas: list[list[float]]  # [[lon, lat], ...] GeoJSON
    distancia_m: float
    duracion_s: float
    evita_restriccion: bool
    viable: bool
    mensaje: str


def dijkstra(
    nodos: dict[int, Nodo],
    adyacencia: dict[int, list[tuple[int, float]]],
    origen_id: int,
    destino_id: int,
) -> tuple[list[int], float] | None:
    """Retorna (camino de ids, costo) o None si no hay ruta."""
    dist = {nid: INF for nid in nodos}
    prev: dict[int, int | None] = {nid: None for nid in nodos}
    dist[origen_id] = 0.0
    heap: list[tuple[float, int]] = [(0.0, origen_id)]

    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        if u == destino_id:
            break
        for v, w in adyacencia.get(u, []):
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                prev[v] = u
                heapq.heappush(heap, (nd, v))

    if dist[destino_id] == INF:
        return None

    path: list[int] = []
    cur: int | None = destino_id
    while cur is not None:
        path.append(cur)
        cur = prev[cur]
    path.reverse()
    return path, dist[destino_id]


def construir_adyacencia(
    nodos: dict[int, Nodo],
    aristas: Iterable[tuple[int, int, float, bool]],
    zonas_bloqueo: Sequence[Sequence[Sequence[float]]] | None = None,
) -> dict[int, list[tuple[int, float]]]:
    """
    aristas: (origen_id, destino_id, distancia_m, bidireccional)
    Si el punto medio cae en zona de bloqueo → no se agrega la arista.
    """
    adj: dict[int, list[tuple[int, float]]] = {nid: [] for nid in nodos}
    zonas = list(zonas_bloqueo or [])

    def bloqueada(a: Nodo, b: Nodo) -> bool:
        if not zonas:
            return False
        mid_lat = (a.lat + b.lat) / 2
        mid_lon = (a.lon + b.lon) / 2
        return punto_en_alguna_zona(mid_lon, mid_lat, zonas)

    for o_id, d_id, dist_m, bidi in aristas:
        a = nodos.get(o_id)
        b = nodos.get(d_id)
        if a is None or b is None:
            continue
        if bloqueada(a, b):
            continue
        w = dist_m if dist_m > 0 else haversine_m(a.lat, a.lon, b.lat, b.lon)
        adj[o_id].append((d_id, w))
        if bidi:
            adj[d_id].append((o_id, w))
    return adj


def nodo_mas_cercano(nodos: dict[int, Nodo], lat: float, lon: float) -> int:
    best_id = next(iter(nodos))
    best_d = INF
    for nid, n in nodos.items():
        d = haversine_m(lat, lon, n.lat, n.lon)
        if d < best_d:
            best_d = d
            best_id = nid
    return best_id


# Velocidad urbana promedio para estimar duración (km/h → m/s)
VELOCIDAD_URBANA_MS = 28_000 / 3600  # ~28 km/h


def calcular_ruta(
    nodos: dict[int, Nodo],
    aristas: Iterable[tuple[int, int, float, bool]],
    origen_lat: float,
    origen_lon: float,
    destino_lat: float,
    destino_lon: float,
    zonas_bloqueo: Sequence[Sequence[Sequence[float]]] | None = None,
    evita_restriccion: bool = False,
) -> ResultadoRuta:
    if not nodos:
        return ResultadoRuta([], [], 0, 0, evita_restriccion, False, "Sin grafo vial para este municipio")

    o_id = nodo_mas_cercano(nodos, origen_lat, origen_lon)
    d_id = nodo_mas_cercano(nodos, destino_lat, destino_lon)
    adj = construir_adyacencia(nodos, aristas, zonas_bloqueo if evita_restriccion else None)
    found = dijkstra(nodos, adj, o_id, d_id)
    if not found:
        return ResultadoRuta(
            [],
            [],
            0,
            0,
            evita_restriccion,
            False,
            "No hay ruta viable evitando la zona restringida"
            if evita_restriccion
            else "No hay ruta viable en el grafo",
        )

    path, dist_m = found
    coords = [[origen_lon, origen_lat]]
    for nid in path:
        n = nodos[nid]
        coords.append([n.lon, n.lat])
    coords.append([destino_lon, destino_lat])
    # Ajuste: incluir tramos snap origen/destino
    snap_extra = haversine_m(origen_lat, origen_lon, nodos[o_id].lat, nodos[o_id].lon)
    snap_extra += haversine_m(destino_lat, destino_lon, nodos[d_id].lat, nodos[d_id].lon)
    total = dist_m + snap_extra
    dur = total / VELOCIDAD_URBANA_MS
    return ResultadoRuta(
        nodo_ids=path,
        coordenadas=coords,
        distancia_m=total,
        duracion_s=dur,
        evita_restriccion=evita_restriccion,
        viable=True,
        mensaje="Ruta alternativa evitando zona de Pico y Placa"
        if evita_restriccion
        else "Ruta directa (sin excluir zonas)",
    )

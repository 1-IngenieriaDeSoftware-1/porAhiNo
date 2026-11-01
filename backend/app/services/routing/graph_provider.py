"""GraphProvider — Dijkstra local como respaldo cuando Valhalla no está disponible."""

from __future__ import annotations

from typing import Optional, Sequence

from app.services.routing.types import LatLon, MatchPoint, MatchResult, PolygonRing, RouteResult
from app.services.routing_engine import Nodo, ResultadoRuta, calcular_ruta, haversine_m


class GraphProvider:
    name = "graph_local"

    def __init__(
        self,
        nodos: dict[int, Nodo],
        aristas: list[tuple[int, int, float, bool]],
    ) -> None:
        self.nodos = nodos
        self.aristas = aristas

    async def route(
        self,
        origin: LatLon,
        dest: LatLon,
        *,
        avoid_polygons: Optional[Sequence[PolygonRing]] = None,
        avoid_locations: Optional[Sequence[LatLon]] = None,
        heading: Optional[float] = None,
    ) -> RouteResult:
        _ = avoid_locations, heading
        zonas = list(avoid_polygons) if avoid_polygons else None
        local: ResultadoRuta = calcular_ruta(
            self.nodos,
            self.aristas,
            origin.lat,
            origin.lon,
            dest.lat,
            dest.lon,
            zonas_bloqueo=zonas,
            evita_restriccion=bool(zonas),
        )
        return RouteResult(
            viable=local.viable,
            distance_m=local.distancia_m,
            duration_s=local.duracion_s,
            coordinates=local.coordenadas or [],
            provider=self.name,
            mensaje=local.mensaje or ("Grafo local" if local.viable else "Sin ruta en grafo local"),
        )

    async def match(self, trace: Sequence[LatLon]) -> MatchResult:
        """Aproxima match proyectando cada punto al nodo más cercano del grafo."""
        if not trace or not self.nodos:
            return MatchResult(viable=False, provider=self.name, mensaje="Sin grafo/traza")
        pts: list[MatchPoint] = []
        coords: list[list[float]] = []
        for p in trace:
            best = min(
                self.nodos.values(),
                key=lambda n: haversine_m(p.lat, p.lon, n.lat, n.lon),
            )
            pts.append(MatchPoint(lat=best.lat, lon=best.lon))
            coords.append([best.lon, best.lat])
        return MatchResult(
            viable=len(pts) >= 1,
            matched=pts,
            coordinates=coords,
            provider=self.name,
            mensaje="Match aproximado a nodos locales",
        )

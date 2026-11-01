"""Contrato RoutingProvider — motor de rutas pluggable."""

from __future__ import annotations

from typing import Optional, Protocol, Sequence, runtime_checkable

from app.services.routing.types import LatLon, MatchResult, PolygonRing, RouteResult


@runtime_checkable
class RoutingProvider(Protocol):
    """Interfaz única para Valhalla (principal) y grafo local (fallback)."""

    name: str

    async def route(
        self,
        origin: LatLon,
        dest: LatLon,
        *,
        avoid_polygons: Optional[Sequence[PolygonRing]] = None,
        avoid_locations: Optional[Sequence[LatLon]] = None,
        heading: Optional[float] = None,
    ) -> RouteResult:
        """Calcula ruta driving. heading en grados [0,360) desde el norte."""
        ...

    async def match(self, trace: Sequence[LatLon]) -> MatchResult:
        """Map matching de una traza corta a la red vial."""
        ...

"""ValhallaProvider — motor principal de ruteo (exclude_polygons / trace_attributes)."""

from __future__ import annotations

from typing import Any, Optional, Sequence

import httpx

from app.core.config import settings
from app.services.routing.types import LatLon, MatchPoint, MatchResult, PolygonRing, RouteResult


def _close_ring(ring: Sequence[Sequence[float]]) -> list[list[float]]:
    pts = [[float(p[0]), float(p[1])] for p in ring]
    if len(pts) >= 2 and pts[0] != pts[-1]:
        pts = pts + [pts[0]]
    return pts


def decode_polyline6(encoded: str) -> list[list[float]]:
    """Decodifica polyline6 de Valhalla → [[lon, lat], ...]."""
    coords: list[list[float]] = []
    index = 0
    lat = 0
    lon = 0
    length = len(encoded)
    while index < length:
        result = 0
        shift = 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlat = ~(result >> 1) if result & 1 else (result >> 1)
        lat += dlat
        result = 0
        shift = 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlon = ~(result >> 1) if result & 1 else (result >> 1)
        lon += dlon
        coords.append([lon / 1e6, lat / 1e6])
    return coords


class ValhallaProvider:
    name = "valhalla"

    def __init__(self, base_url: str | None = None, timeout: float = 12.0) -> None:
        self.base_url = (base_url or settings.VALHALLA_BASE_URL).rstrip("/")
        self.timeout = timeout

    def _costing_options(self) -> dict[str, Any]:
        # Penaliza maniobras/semáforos en ETA; no inventa fases de luz.
        return {
            "auto": {
                "maneuver_penalty": 5,
                "gate_cost": 30,
                "country_crossing_cost": 600,
                "service_penalty": 15,
                "use_ferry": 0.1,
                "use_living_streets": 0.5,
                "use_tracks": 0,
                "use_highways": 1,
                "use_tolls": 1,
                "top_speed": 90,
            }
        }

    async def route(
        self,
        origin: LatLon,
        dest: LatLon,
        *,
        avoid_polygons: Optional[Sequence[PolygonRing]] = None,
        avoid_locations: Optional[Sequence[LatLon]] = None,
        heading: Optional[float] = None,
    ) -> RouteResult:
        loc_o: dict[str, Any] = {"lat": origin.lat, "lon": origin.lon}
        if heading is not None:
            loc_o["heading"] = float(heading) % 360.0
            loc_o["heading_tolerance"] = 45
        body: dict[str, Any] = {
            "locations": [
                loc_o,
                {"lat": dest.lat, "lon": dest.lon},
            ],
            "costing": "auto",
            "directions_options": {"units": "kilometers"},
            "shape_format": "polyline6",
            "costing_options": self._costing_options(),
        }
        if avoid_polygons:
            body["exclude_polygons"] = [
                _close_ring(r) for r in avoid_polygons if len(r) >= 3
            ]
        if avoid_locations:
            body["exclude_locations"] = [
                {"lon": p.lon, "lat": p.lat} for p in avoid_locations
            ]

        url = f"{self.base_url}/route"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(url, json=body)
                if resp.status_code != 200:
                    return RouteResult(
                        viable=False,
                        provider=self.name,
                        mensaje=f"Valhalla route HTTP {resp.status_code}",
                    )
                data = resp.json()
        except Exception as exc:  # noqa: BLE001 — fallback al caller
            return RouteResult(
                viable=False,
                provider=self.name,
                mensaje=f"Valhalla no disponible: {exc}",
            )

        trip = data.get("trip") or {}
        legs = trip.get("legs") or []
        if not legs:
            return RouteResult(
                viable=False,
                provider=self.name,
                mensaje="Valhalla no devolvió legs",
            )

        coords: list[list[float]] = []
        dist_km = float(trip.get("summary", {}).get("length") or 0)
        dur_s = float(trip.get("summary", {}).get("time") or 0)
        for leg in legs:
            shape = leg.get("shape")
            if isinstance(shape, str) and shape:
                coords.extend(decode_polyline6(shape))
            elif isinstance(shape, dict) and shape.get("coordinates"):
                coords.extend([[float(c[0]), float(c[1])] for c in shape["coordinates"]])
            elif isinstance(shape, list) and shape and isinstance(shape[0], (list, tuple)):
                coords.extend([[float(c[0]), float(c[1])] for c in shape])

        if len(coords) < 2:
            return RouteResult(
                viable=False,
                provider=self.name,
                mensaje="Valhalla sin geometría usable",
            )

        cleaned: list[list[float]] = [coords[0]]
        for c in coords[1:]:
            if c != cleaned[-1]:
                cleaned.append(c)

        return RouteResult(
            viable=True,
            distance_m=dist_km * 1000.0,
            duration_s=dur_s,
            coordinates=cleaned,
            provider=self.name,
            mensaje="Ruta Valhalla",
        )

    async def match(self, trace: Sequence[LatLon]) -> MatchResult:
        if len(trace) < 2:
            return MatchResult(
                viable=False,
                provider=self.name,
                mensaje="Traza insuficiente (mín. 2 puntos)",
            )
        body = {
            "shape": [{"lat": p.lat, "lon": p.lon} for p in trace],
            "costing": "auto",
            "shape_match": "map_snap",
            "filters": {
                "attributes": [
                    "edge.id",
                    "edge.length",
                    "matched.point",
                    "matched.type",
                ],
                "action": "include",
            },
        }
        url = f"{self.base_url}/trace_attributes"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(url, json=body)
                if resp.status_code != 200:
                    return MatchResult(
                        viable=False,
                        provider=self.name,
                        mensaje=f"Valhalla match HTTP {resp.status_code}",
                    )
                data = resp.json()
        except Exception as exc:  # noqa: BLE001
            return MatchResult(
                viable=False,
                provider=self.name,
                mensaje=f"Valhalla match error: {exc}",
            )

        matched_pts: list[MatchPoint] = []
        coords: list[list[float]] = []
        for m in data.get("matched_points") or []:
            lat = m.get("lat")
            lon = m.get("lon")
            if lat is None or lon is None:
                continue
            matched_pts.append(
                MatchPoint(
                    lat=float(lat),
                    lon=float(lon),
                    edge_index=m.get("edge_index"),
                )
            )
            coords.append([float(lon), float(lat)])

        if len(coords) < 1:
            return MatchResult(
                viable=False,
                provider=self.name,
                mensaje="Sin puntos matched",
            )

        return MatchResult(
            viable=True,
            matched=matched_pts,
            coordinates=coords,
            provider=self.name,
            mensaje="Map matching Valhalla",
        )

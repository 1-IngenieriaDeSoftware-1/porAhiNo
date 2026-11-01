"""Tipos tipados del motor de ruteo (RoutingProvider)."""

from __future__ import annotations

from typing import List, Optional, Sequence

from pydantic import BaseModel, Field


class LatLon(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)


class RouteLeg(BaseModel):
    distance_m: float
    duration_s: float
    # [[lon, lat], ...] GeoJSON order
    coordinates: List[List[float]] = Field(default_factory=list)


class RouteResult(BaseModel):
    viable: bool
    distance_m: float = 0.0
    duration_s: float = 0.0
    coordinates: List[List[float]] = Field(default_factory=list)
    provider: str = ""
    mensaje: str = ""
    legs: List[RouteLeg] = Field(default_factory=list)


class MatchPoint(BaseModel):
    lat: float
    lon: float
    edge_index: Optional[int] = None
    distance_along_edge_m: Optional[float] = None


class MatchResult(BaseModel):
    viable: bool
    matched: List[MatchPoint] = Field(default_factory=list)
    # polilínea pegada a vía [[lon, lat], ...]
    coordinates: List[List[float]] = Field(default_factory=list)
    provider: str = ""
    mensaje: str = ""


# Anillo GeoJSON: lista de [lon, lat]
PolygonRing = Sequence[Sequence[float]]

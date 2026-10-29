"""Schemas MainV2 — rutas y capas de mapa."""

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field


class RutaRequest(BaseModel):
    origen_lat: float = Field(..., ge=-90, le=90)
    origen_lon: float = Field(..., ge=-180, le=180)
    destino_lat: float = Field(..., ge=-90, le=90)
    destino_lon: float = Field(..., ge=-180, le=180)
    municipio_id: int
    placa: Optional[str] = None
    fecha_hora: Optional[datetime] = None


class GeoJSONLineString(BaseModel):
    type: str = "LineString"
    coordinates: List[List[float]]


class RutaOpcion(BaseModel):
    tipo: str  # "directa" | "alternativa"
    viable: bool
    distancia_m: float
    duracion_s: float
    duracion_min: float
    mensaje: str
    geometria: GeoJSONLineString
    evita_restriccion: bool


class RutaResponse(BaseModel):
    municipio: str
    placa: Optional[str]
    restringido: bool
    mensaje_restriccion: str
    diferencia_min: Optional[float] = None
    rutas: List[RutaOpcion]


class ZonaResponse(BaseModel):
    id: int
    municipio_id: int
    municipio: str
    nombre: str
    geometria: List[List[float]]
    descripcion: Optional[str] = None


class CamaraResponse(BaseModel):
    id: int
    municipio_id: Optional[int]
    municipio: Optional[str]
    nombre: str
    lat: float
    lon: float
    tipo: str
    fuente: Optional[str] = None


class GeocodeHit(BaseModel):
    display_name: str
    lat: float
    lon: float
    extra: dict[str, Any] = Field(default_factory=dict)


class PushSubscribeRequest(BaseModel):
    endpoint: str
    keys: dict[str, str]
    user_agent: Optional[str] = None

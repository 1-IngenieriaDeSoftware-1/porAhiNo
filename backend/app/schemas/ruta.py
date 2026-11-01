"""Schemas MainV2 — rutas, match GPS y capas de mapa."""

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
    # Legacy: fecha_hora de consulta normativa
    fecha_hora: Optional[datetime] = None
    # Hora de salida para evaluar Pico y Placa al llegar a la zona
    hora_salida: Optional[datetime] = None
    # Rumbo actual [0,360) para recalculo Valhalla
    heading: Optional[float] = Field(default=None, ge=0, lt=360)


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
    provider: Optional[str] = None


class RutaResponse(BaseModel):
    municipio: str
    placa: Optional[str]
    restringido: bool
    mensaje_restriccion: str
    diferencia_min: Optional[float] = None
    rutas: List[RutaOpcion]
    # Pico y Placa temporal
    hora_salida: Optional[datetime] = None
    eta_entrada_zona: Optional[datetime] = None
    restriccion_en_eta: Optional[bool] = None


class MatchPointIn(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)


class MatchRequest(BaseModel):
    points: List[MatchPointIn] = Field(..., min_length=2)
    municipio_id: Optional[int] = None


class MatchPointOut(BaseModel):
    lat: float
    lon: float


class MatchResponse(BaseModel):
    viable: bool
    mensaje: str
    provider: str
    matched: List[MatchPointOut] = Field(default_factory=list)
    geometria: GeoJSONLineString = Field(
        default_factory=lambda: GeoJSONLineString(coordinates=[])
    )


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


class SemaforoResponse(BaseModel):
    id: int
    municipio_id: Optional[int]
    lat: float
    lon: float
    nombre: Optional[str] = None
    osm_id: Optional[int] = None


class GeocodeHit(BaseModel):
    display_name: str
    lat: float
    lon: float
    extra: dict[str, Any] = Field(default_factory=dict)


class PushSubscribeRequest(BaseModel):
    endpoint: str
    keys: dict[str, str]
    user_agent: Optional[str] = None

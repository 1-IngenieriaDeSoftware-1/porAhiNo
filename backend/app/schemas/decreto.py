"""
Schemas Pydantic: Decreto de Pico y Placa

Usado principalmente por el panel de administración (US-004).
"""

from datetime import date, time
from typing import Optional, List
from pydantic import BaseModel


class DecretoCreate(BaseModel):
    municipio_id: int
    numero_decreto: Optional[str] = None
    descripcion: Optional[str] = None
    hora_inicio: time
    hora_fin: time
    dias_restriccion: str   # ej: "1,2,3,4,5" (Lun-Vie)
    digitos_restringidos: str  # ej: "1,2"
    vigencia_desde: date
    vigencia_hasta: Optional[date] = None


class DecretoUpdate(BaseModel):
    descripcion: Optional[str] = None
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    dias_restriccion: Optional[str] = None
    digitos_restringidos: Optional[str] = None
    vigencia_hasta: Optional[date] = None
    is_active: Optional[bool] = None


class DecretoResponse(BaseModel):
    id: int
    municipio_id: int
    numero_decreto: Optional[str]
    descripcion: Optional[str]
    hora_inicio: time
    hora_fin: time
    dias_restriccion: str
    digitos_restringidos: str
    vigencia_desde: date
    vigencia_hasta: Optional[date]
    is_active: bool

    model_config = {"from_attributes": True}

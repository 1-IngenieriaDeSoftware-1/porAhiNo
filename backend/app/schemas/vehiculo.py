"""
Schemas Pydantic: Vehiculo

Valida el formato de placa colombiana (AAA000 o ABC12D).
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator

from app.core.placa import validar_placa
from app.models.vehiculo import TipoVehiculo


class VehiculoCreate(BaseModel):
    placa: str
    tipo: TipoVehiculo = TipoVehiculo.PARTICULAR
    alias: Optional[str] = None

    @field_validator("placa")
    @classmethod
    def normalizar_y_validar_placa(cls, v: str) -> str:
        return validar_placa(v)


class VehiculoUpdate(BaseModel):
    alias: Optional[str] = None
    tipo: Optional[TipoVehiculo] = None


class VehiculoResponse(BaseModel):
    id: int
    placa: str
    tipo: TipoVehiculo
    alias: Optional[str]
    id_usuario: int
    created_at: datetime

    model_config = {"from_attributes": True}

"""
Schemas Pydantic: Vehiculo

Valida el formato de placa colombiana (AAA000 o ABC12D).
"""

import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator

from app.models.vehiculo import TipoVehiculo

# Regex placa colombiana: 3 letras + 3 dígitos (particular/carga) o 3 letras + 2 dígitos + 1 letra (moto)
PLACA_REGEX = re.compile(r'^[A-Z]{3}[0-9]{2}[A-Z0-9]$')


class VehiculoCreate(BaseModel):
    placa: str
    tipo: TipoVehiculo = TipoVehiculo.PARTICULAR
    alias: Optional[str] = None

    @field_validator("placa")
    @classmethod
    def validar_placa(cls, v: str) -> str:
        placa = v.upper().strip()
        if not PLACA_REGEX.match(placa):
            raise ValueError(
                "Formato de placa inválido. Use formato colombiano: ABC123 o ABC12D"
            )
        return placa


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

"""Schema de Municipio — catálogo de ciudades con Pico y Placa."""

from typing import Optional

from pydantic import BaseModel, Field


class MunicipioCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    departamento: str = Field(..., min_length=2, max_length=100)
    codigo_dane: Optional[str] = Field(default=None, max_length=10)


class MunicipioResponse(BaseModel):
    id: int
    nombre: str
    departamento: str
    codigo_dane: Optional[str] = None

    model_config = {"from_attributes": True}

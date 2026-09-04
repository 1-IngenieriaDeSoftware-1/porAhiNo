"""
Schemas Pydantic: Consulta de Pico y Placa

Define la entrada y salida del endpoint de consulta de restricción.
Optimizado para respuesta en <1 segundo (lógica en service, schema solo valida).
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, field_validator

from app.core.placa import validar_placa


class ConsultaRequest(BaseModel):
    """Entrada para consultar restricción de Pico y Placa (US-002)."""

    placa: str
    municipio_id: int
    fecha_hora: Optional[datetime] = None

    @field_validator("placa")
    @classmethod
    def normalizar_y_validar_placa(cls, v: str) -> str:
        return validar_placa(v)


class RestriccionDetalle(BaseModel):
    """Detalle de la restricción encontrada."""
    decreto_id: int
    hora_inicio: str
    hora_fin: str
    dias_restriccion: List[int]
    digitos_restringidos: List[str]
    descripcion: Optional[str] = None


class ConsultaResponse(BaseModel):
    """Respuesta de consulta de restricción."""
    placa: str
    municipio: str
    fecha_hora_consultada: datetime
    tiene_restriccion: bool
    detalle: Optional[RestriccionDetalle] = None
    mensaje: str  # Texto legible para el usuario

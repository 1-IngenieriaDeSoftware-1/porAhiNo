"""
Schemas Pydantic: Consulta de Pico y Placa

Define la entrada y salida del endpoint de consulta de restricción.
Optimizado para respuesta en <1 segundo (lógica en service, schema solo valida).
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class ConsultaRequest(BaseModel):
    """Entrada para consultar restricción de Pico y Placa."""
    placa: str                          # Placa del vehículo
    municipio_id: int                   # ID del municipio a consultar
    fecha_hora: Optional[datetime] = None  # Si None, usa fecha/hora actual Colombia


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

"""Schemas de suscripción de alerta (US-DB-07 / US-005)."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AlertaCreate(BaseModel):
    id_vehiculo: int
    minutos_antes: int = Field(default=60, gt=0, le=24 * 60)


class AlertaUpdate(BaseModel):
    minutos_antes: Optional[int] = Field(default=None, gt=0, le=24 * 60)
    is_active: Optional[bool] = None


class AlertaResponse(BaseModel):
    id: int
    id_usuario: int
    id_vehiculo: int
    minutos_antes: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

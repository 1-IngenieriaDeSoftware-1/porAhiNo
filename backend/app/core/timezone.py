"""Zona horaria de operación: America/Bogota (Colombia, UTC-5, sin DST)."""

from datetime import datetime
from zoneinfo import ZoneInfo

ZONA_COLOMBIA = ZoneInfo("America/Bogota")


def ahora_colombia() -> datetime:
    """Fecha/hora actual en Colombia, aware (con tzinfo)."""
    return datetime.now(ZONA_COLOMBIA)


def a_colombia(dt: datetime) -> datetime:
    """Convierte un datetime a zona Colombia. Si es naive, se asume Bogotá."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=ZONA_COLOMBIA)
    return dt.astimezone(ZONA_COLOMBIA)

"""Routers HTTP — un módulo por bounded context del SRS."""

from app.routers import admin, auth, consulta, vehiculos

__all__ = ["auth", "vehiculos", "consulta", "admin"]

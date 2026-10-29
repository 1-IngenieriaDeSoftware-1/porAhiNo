"""Routers HTTP — un módulo por bounded context del SRS."""

from app.routers import admin, auth, consulta, push, rutas, vehiculos

__all__ = ["auth", "vehiculos", "consulta", "admin", "rutas", "push"]

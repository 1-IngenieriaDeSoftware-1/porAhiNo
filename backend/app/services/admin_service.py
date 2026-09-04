"""
Servicio: Administración de Decretos y Municipios (US-004).

Responsabilidades:
- CRUD de decretos de Pico y Placa
- CRUD de municipios
- Validaciones de negocio (no crear decretos con fechas solapadas, etc.)

Acceso restringido: Solo usuarios con rol ADMIN pueden usar este servicio.
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.decreto import Decreto
from app.models.municipio import Municipio
from app.schemas.decreto import DecretoCreate, DecretoUpdate


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # --- Decretos ---

    async def get_decretos(self, municipio_id: Optional[int] = None) -> List[Decreto]:
        """TODO: Listar decretos, opcionalmente filtrar por municipio."""
        raise NotImplementedError("Listado de decretos pendiente (US-004)")

    async def create_decreto(self, payload: DecretoCreate) -> Decreto:
        """
        Crea un nuevo decreto de Pico y Placa.
        TODO:
          1. Validar que el municipio existe
          2. Verificar solapamiento de fechas con decretos existentes
          3. Crear y persistir el decreto
        """
        raise NotImplementedError("Creación de decreto pendiente (US-004)")

    async def update_decreto(self, decreto_id: int, payload: DecretoUpdate) -> Decreto:
        """TODO: Actualizar decreto existente. Las consultas futuras deben ver el cambio de inmediato (AC-005)."""
        raise NotImplementedError("Actualización de decreto pendiente (US-004)")

    async def delete_decreto(self, decreto_id: int) -> None:
        """TODO: Soft delete (is_active=False) para no romper historial."""
        raise NotImplementedError("Eliminación de decreto pendiente (US-004)")

    # --- Municipios ---

    async def get_municipios(self) -> List[Municipio]:
        """TODO: Listar todos los municipios."""
        raise NotImplementedError("Listado de municipios pendiente (US-004)")

    async def create_municipio(self, nombre: str, departamento: str, codigo_dane: str = None) -> Municipio:
        """TODO: Crear nuevo municipio. Validar que no exista duplicado."""
        raise NotImplementedError("Creación de municipio pendiente (US-004)")

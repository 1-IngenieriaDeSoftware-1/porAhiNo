"""
Servicio: Gestión de Vehículos (US-001, US-006).

Responsabilidades:
- CRUD de vehículos del usuario
- Validación de placa colombiana (complementa schema Pydantic)
- Verificar que el usuario no supere el límite de vehículos (regla de negocio)
"""

from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.vehiculo import Vehiculo
from app.schemas.vehiculo import VehiculoCreate, VehiculoUpdate


class VehiculoService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_usuario(self, usuario_id: int) -> List[Vehiculo]:
        """
        Lista los vehículos de un usuario.
        TODO: SELECT * FROM vehiculos WHERE id_usuario = usuario_id
        """
        raise NotImplementedError("Listado de vehículos pendiente (US-001 / US-006)")

    async def create(self, payload: VehiculoCreate, usuario_id: int) -> Vehiculo:
        """
        Registra un nuevo vehículo.
        TODO:
          1. Verificar que la placa no está duplicada para el usuario
          2. Crear instancia Vehiculo
          3. Agregar a la sesión y commit
        """
        raise NotImplementedError("Registro de vehículo pendiente (US-001)")

    async def get_by_id(self, vehiculo_id: int, usuario_id: int) -> Vehiculo:
        """
        Obtiene un vehículo por ID, verificando que pertenece al usuario.
        TODO: Agregar control de acceso
        """
        raise NotImplementedError("Detalle de vehículo pendiente (US-001)")

    async def update(self, vehiculo_id: int, payload: VehiculoUpdate, usuario_id: int) -> Vehiculo:
        """TODO: Actualizar alias y/o tipo del vehículo."""
        raise NotImplementedError("Actualización de vehículo pendiente (US-001)")

    async def delete(self, vehiculo_id: int, usuario_id: int) -> None:
        """TODO: Eliminar vehículo verificando pertenencia al usuario."""
        raise NotImplementedError("Eliminación de vehículo pendiente (US-001)")

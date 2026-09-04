"""
Servicio: Gestión de Vehículos (US-001, US-006, US-DB-04).

La persistencia (insertar, unique por usuario+placa, listar los del dueño)
queda aquí. Update/delete de negocio siguen en US-001.
"""

from typing import List

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError
from app.core.placa import validar_placa
from app.models.vehiculo import Vehiculo
from app.schemas.vehiculo import VehiculoCreate, VehiculoUpdate


class VehiculoService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_usuario(self, usuario_id: int) -> List[Vehiculo]:
        result = await self.db.execute(
            select(Vehiculo)
            .where(Vehiculo.id_usuario == usuario_id)
            .order_by(Vehiculo.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, payload: VehiculoCreate, usuario_id: int) -> Vehiculo:
        placa = validar_placa(payload.placa)
        duplicado = await self.db.execute(
            select(Vehiculo.id).where(
                Vehiculo.id_usuario == usuario_id,
                Vehiculo.placa == placa,
            )
        )
        if duplicado.scalar_one_or_none() is not None:
            raise ConflictError("Ya tienes un vehículo con esa placa")

        vehiculo = Vehiculo(
            placa=placa,
            tipo=payload.tipo,
            alias=payload.alias,
            id_usuario=usuario_id,
        )
        self.db.add(vehiculo)
        try:
            await self.db.flush()
        except IntegrityError as exc:
            raise ConflictError("Ya tienes un vehículo con esa placa") from exc
        await self.db.refresh(vehiculo)
        return vehiculo

    async def get_by_id(self, vehiculo_id: int, usuario_id: int) -> Vehiculo:
        """TODO: Agregar control de acceso."""
        raise NotImplementedError("Detalle de vehículo pendiente (US-001)")

    async def update(self, vehiculo_id: int, payload: VehiculoUpdate, usuario_id: int) -> Vehiculo:
        """TODO: Actualizar alias y/o tipo del vehículo."""
        raise NotImplementedError("Actualización de vehículo pendiente (US-001)")

    async def delete(self, vehiculo_id: int, usuario_id: int) -> None:
        """TODO: Eliminar vehículo verificando pertenencia al usuario."""
        raise NotImplementedError("Eliminación de vehículo pendiente (US-001)")

"""
Servicio: persistencia de suscripciones de alerta (US-DB-07).

Habilita US-005 (R2): el scheduler/push no vive aquí; solo guardar
usuario + vehículo + minutos_antes + is_active.
"""

from typing import List

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.alerta import Alerta
from app.models.vehiculo import Vehiculo
from app.schemas.alerta import AlertaCreate


class AlertasService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def listar_por_usuario(self, usuario_id: int) -> List[Alerta]:
        result = await self.db.execute(
            select(Alerta)
            .where(Alerta.id_usuario == usuario_id)
            .order_by(Alerta.created_at.desc())
        )
        return list(result.scalars().all())

    async def suscribir(self, usuario_id: int, payload: AlertaCreate) -> Alerta:
        vehiculo = (
            await self.db.execute(
                select(Vehiculo).where(
                    Vehiculo.id == payload.id_vehiculo,
                    Vehiculo.id_usuario == usuario_id,
                )
            )
        ).scalar_one_or_none()
        if vehiculo is None:
            raise NotFoundError("No tienes un vehículo con ese id")

        existente = (
            await self.db.execute(
                select(Alerta).where(
                    Alerta.id_usuario == usuario_id,
                    Alerta.id_vehiculo == payload.id_vehiculo,
                )
            )
        ).scalar_one_or_none()
        if existente is not None:
            existente.minutos_antes = payload.minutos_antes
            existente.is_active = True
            await self.db.flush()
            await self.db.refresh(existente)
            return existente

        alerta = Alerta(
            id_usuario=usuario_id,
            id_vehiculo=payload.id_vehiculo,
            minutos_antes=payload.minutos_antes,
            is_active=True,
        )
        self.db.add(alerta)
        try:
            await self.db.flush()
        except IntegrityError as exc:
            raise ConflictError("Ya existe una alerta para ese vehículo") from exc
        await self.db.refresh(alerta)
        return alerta

    async def desactivar(self, alerta_id: int, usuario_id: int) -> Alerta:
        alerta = (
            await self.db.execute(
                select(Alerta).where(Alerta.id == alerta_id, Alerta.id_usuario == usuario_id)
            )
        ).scalar_one_or_none()
        if alerta is None:
            raise NotFoundError("Alerta no encontrada")
        alerta.desactivar()
        await self.db.flush()
        await self.db.refresh(alerta)
        return alerta

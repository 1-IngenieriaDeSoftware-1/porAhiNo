"""
Servicio: Administración de Decretos y Municipios (US-004).

Responsabilidades:
- CRUD de decretos de Pico y Placa (US-004.2 / #45)
- CRUD de municipios
- Validaciones de negocio (fechas, horas, integridad)
- Actualización inmediata en consultas (AC-005 / US-004.3)

Acceso restringido: Solo usuarios con rol ADMIN pueden usar este servicio.
"""

from __future__ import annotations

from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ConflictError, NotFoundError
from app.models.decreto import Decreto
from app.models.municipio import Municipio
from app.schemas.decreto import DecretoCreate, DecretoUpdate


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # --- Decretos ---

    async def get_decretos(self, municipio_id: Optional[int] = None) -> List[Decreto]:
        """Listar decretos, opcionalmente filtrando por municipio."""
        stmt = select(Decreto)
        if municipio_id is not None:
            stmt = stmt.where(Decreto.municipio_id == municipio_id)
        stmt = stmt.order_by(
            Decreto.municipio_id.asc(),
            Decreto.vigencia_desde.desc(),
            Decreto.id.desc(),
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create_decreto(self, payload: DecretoCreate) -> Decreto:
        """
        Crea un nuevo decreto de Pico y Placa.
        1. Valida que el municipio existe
        2. Valida coherencia horaria (hora_inicio < hora_fin)
        3. Valida vigencia (vigencia_hasta >= vigencia_desde)
        4. Crea y persiste el decreto
        """
        mun = await self.db.execute(
            select(Municipio.id).where(Municipio.id == payload.municipio_id)
        )
        if mun.scalar_one_or_none() is None:
            raise NotFoundError("Municipio no encontrado")

        if payload.hora_inicio >= payload.hora_fin:
            raise AppError("La hora de inicio debe ser anterior a la hora de fin", 422)

        if payload.vigencia_hasta and payload.vigencia_hasta < payload.vigencia_desde:
            raise AppError("La fecha vigencia_hasta debe ser posterior o igual a vigencia_desde", 422)

        decreto = Decreto(
            municipio_id=payload.municipio_id,
            numero_decreto=payload.numero_decreto,
            descripcion=payload.descripcion,
            hora_inicio=payload.hora_inicio,
            hora_fin=payload.hora_fin,
            dias_restriccion=payload.dias_restriccion,
            digitos_restringidos=payload.digitos_restringidos,
            vigencia_desde=payload.vigencia_desde,
            vigencia_hasta=payload.vigencia_hasta,
            is_active=True,
        )
        self.db.add(decreto)
        await self.db.flush()
        await self.db.refresh(decreto)
        return decreto

    async def update_decreto(self, decreto_id: int, payload: DecretoUpdate) -> Decreto:
        """Actualizar decreto existente. Las consultas futuras ven el cambio de inmediato (AC-005)."""
        result = await self.db.execute(
            select(Decreto).where(Decreto.id == decreto_id)
        )
        decreto = result.scalar_one_or_none()
        if decreto is None:
            raise NotFoundError("Decreto no encontrado")

        hora_inicio = payload.hora_inicio if payload.hora_inicio is not None else decreto.hora_inicio
        hora_fin = payload.hora_fin if payload.hora_fin is not None else decreto.hora_fin
        if hora_inicio >= hora_fin:
            raise AppError("La hora de inicio debe ser anterior a la hora de fin", 422)

        vigencia_desde = decreto.vigencia_desde
        vigencia_hasta = payload.vigencia_hasta if payload.vigencia_hasta is not None else decreto.vigencia_hasta
        if vigencia_hasta and vigencia_hasta < vigencia_desde:
            raise AppError("La fecha vigencia_hasta debe ser posterior o igual a vigencia_desde", 422)

        if payload.descripcion is not None:
            decreto.descripcion = payload.descripcion
        if payload.hora_inicio is not None:
            decreto.hora_inicio = payload.hora_inicio
        if payload.hora_fin is not None:
            decreto.hora_fin = payload.hora_fin
        if payload.dias_restriccion is not None:
            decreto.dias_restriccion = payload.dias_restriccion
        if payload.digitos_restringidos is not None:
            decreto.digitos_restringidos = payload.digitos_restringidos
        if payload.vigencia_hasta is not None:
            decreto.vigencia_hasta = payload.vigencia_hasta
        if payload.is_active is not None:
            decreto.is_active = payload.is_active

        await self.db.flush()
        await self.db.refresh(decreto)
        return decreto

    async def delete_decreto(self, decreto_id: int) -> None:
        """Soft delete (is_active=False) para conservar historial de auditoría de consultas previas."""
        result = await self.db.execute(
            select(Decreto).where(Decreto.id == decreto_id)
        )
        decreto = result.scalar_one_or_none()
        if decreto is None:
            raise NotFoundError("Decreto no encontrado")
        decreto.desactivar()
        await self.db.flush()

    # --- Municipios ---

    async def get_municipios(self) -> List[Municipio]:
        """Listar todos los municipios ordenados alfabéticamente."""
        result = await self.db.execute(
            select(Municipio).order_by(Municipio.nombre.asc())
        )
        return list(result.scalars().all())

    async def create_municipio(
        self, nombre: str, departamento: str, codigo_dane: Optional[str] = None
    ) -> Municipio:
        """Crear nuevo municipio validando que no exista duplicado."""
        dup = await self.db.execute(
            select(Municipio.id).where(
                Municipio.nombre.ilike(nombre.strip()),
                Municipio.departamento.ilike(departamento.strip()),
            )
        )
        if dup.scalar_one_or_none() is not None:
            raise ConflictError("El municipio ya existe en ese departamento")

        municipio = Municipio(
            nombre=nombre.strip(),
            departamento=departamento.strip(),
            codigo_dane=codigo_dane.strip() if codigo_dane else None,
        )
        self.db.add(municipio)
        await self.db.flush()
        await self.db.refresh(municipio)
        return municipio

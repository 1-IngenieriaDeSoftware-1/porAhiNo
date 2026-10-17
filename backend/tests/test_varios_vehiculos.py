"""US-006.1: guardar y listar varios vehiculos por usuario."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.models.vehiculo import TipoVehiculo, Vehiculo
from app.schemas.vehiculo import VehiculoCreate
from app.services.vehiculo_service import VehiculoService


@pytest.mark.asyncio
async def test_puede_registrar_mas_de_un_vehiculo(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "app.services.vehiculo_service.validar_placa", lambda placa: placa.upper()
    )

    creados: list[Vehiculo] = []
    db = AsyncMock()

    async def execute(_stmt):
        result = MagicMock()
        result.scalar_one_or_none = lambda: None
        result.scalars = lambda: MagicMock(all=lambda: list(creados))
        return result

    db.execute = execute
    db.add = MagicMock(side_effect=lambda v: creados.append(v))
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    service = VehiculoService(db)
    await service.create(
        VehiculoCreate(placa="abc123", tipo=TipoVehiculo.PARTICULAR, alias="Casa"),
        usuario_id=1,
    )
    await service.create(
        VehiculoCreate(placa="xyz12d", tipo=TipoVehiculo.MOTO, alias="Moto"),
        usuario_id=1,
    )

    assert len(creados) == 2
    assert {v.placa for v in creados} == {"ABC123", "XYZ12D"}

    listados = await service.get_by_usuario(1)
    assert len(listados) == 2


def test_unique_permite_misma_placa_en_otro_usuario() -> None:
    from sqlalchemy import UniqueConstraint

    uniques = [
        c for c in Vehiculo.__table__.constraints if isinstance(c, UniqueConstraint)
    ]
    constraint = next(c for c in uniques if c.name == "uq_vehiculos_usuario_placa")
    assert {col.name for col in constraint.columns} == {"id_usuario", "placa"}

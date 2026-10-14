"""Tests para US-004.2 (#45) y US-004 (#30): gestión y edición de decretos en el panel admin."""

from __future__ import annotations

from datetime import date, time
import inspect
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.exceptions import AppError, NotFoundError
from app.models.decreto import Decreto
from app.models.municipio import Municipio
from app.schemas.decreto import DecretoCreate, DecretoUpdate
from app.services.admin_service import AdminService


def test_metodos_admin_estan_implementados() -> None:
    for metodo in [
        AdminService.get_decretos,
        AdminService.create_decreto,
        AdminService.update_decreto,
        AdminService.delete_decreto,
        AdminService.get_municipios,
        AdminService.create_municipio,
    ]:
        assert inspect.iscoroutinefunction(metodo)
        assert "NotImplementedError" not in inspect.getsource(metodo)


@pytest.mark.asyncio
async def test_create_decreto_exitoso() -> None:
    db = AsyncMock()
    # Mock para verificar existencia de municipio
    mock_mun_result = MagicMock()
    mock_mun_result.scalar_one_or_none.return_value = 1
    db.execute = AsyncMock(return_value=mock_mun_result)
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    service = AdminService(db)
    payload = DecretoCreate(
        municipio_id=1,
        numero_decreto="DEC-2026-001",
        descripcion="Pico y placa particular",
        hora_inicio=time(6, 0),
        hora_fin=time(20, 0),
        dias_restriccion="0,1,2,3,4",
        digitos_restringidos="1,2",
        vigencia_desde=date(2026, 1, 1),
    )

    decreto = await service.create_decreto(payload)

    assert decreto.municipio_id == 1
    assert decreto.hora_inicio == time(6, 0)
    assert decreto.hora_fin == time(20, 0)
    assert decreto.is_active is True
    db.add.assert_called_once()
    db.flush.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_decreto_municipio_no_existe() -> None:
    db = AsyncMock()
    mock_mun_result = MagicMock()
    mock_mun_result.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(return_value=mock_mun_result)

    service = AdminService(db)
    payload = DecretoCreate(
        municipio_id=999,
        hora_inicio=time(6, 0),
        hora_fin=time(20, 0),
        dias_restriccion="0,1,2,3,4",
        digitos_restringidos="1,2",
        vigencia_desde=date(2026, 1, 1),
    )

    with pytest.raises(NotFoundError):
        await service.create_decreto(payload)


@pytest.mark.asyncio
async def test_create_decreto_hora_invalida() -> None:
    db = AsyncMock()
    mock_mun_result = MagicMock()
    mock_mun_result.scalar_one_or_none.return_value = 1
    db.execute = AsyncMock(return_value=mock_mun_result)

    service = AdminService(db)
    payload = DecretoCreate(
        municipio_id=1,
        hora_inicio=time(20, 0),
        hora_fin=time(6, 0),  # Hora fin anterior a hora inicio
        dias_restriccion="0,1,2,3,4",
        digitos_restringidos="1,2",
        vigencia_desde=date(2026, 1, 1),
    )

    with pytest.raises(AppError) as exc_info:
        await service.create_decreto(payload)
    assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_update_decreto_modifica_horas() -> None:
    decreto = Decreto(
        id=5,
        municipio_id=1,
        hora_inicio=time(6, 0),
        hora_fin=time(20, 0),
        dias_restriccion="0,1,2,3,4",
        digitos_restringidos="1,2",
        vigencia_desde=date(2026, 1, 1),
        is_active=True,
    )

    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = decreto
    db.execute = AsyncMock(return_value=mock_result)
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    service = AdminService(db)
    updated = await service.update_decreto(
        decreto_id=5,
        payload=DecretoUpdate(
            hora_inicio=time(7, 0),
            hora_fin=time(19, 0),
            digitos_restringidos="3,4",
        ),
    )

    assert updated.hora_inicio == time(7, 0)
    assert updated.hora_fin == time(19, 0)
    assert updated.digitos_restringidos == "3,4"
    db.flush.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_decreto_hace_soft_delete() -> None:
    decreto = Decreto(
        id=5,
        municipio_id=1,
        hora_inicio=time(6, 0),
        hora_fin=time(20, 0),
        dias_restriccion="0,1,2,3,4",
        digitos_restringidos="1,2",
        vigencia_desde=date(2026, 1, 1),
        is_active=True,
    )

    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = decreto
    db.execute = AsyncMock(return_value=mock_result)
    db.flush = AsyncMock()

    service = AdminService(db)
    await service.delete_decreto(5)

    assert decreto.is_active is False
    db.flush.assert_awaited_once()

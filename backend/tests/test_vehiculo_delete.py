"""Tests para US-001 / Issue #68: eliminar y actualizar vehículo con control de pertenencia."""

from __future__ import annotations

import inspect
from unittest.mock import AsyncMock, MagicMock

try:
    import pytest
except ImportError:
    class _PytestMock:
        class mark:
            @staticmethod
            def asyncio(fn):
                return fn

        @staticmethod
        def raises(expected_exception):
            class _RaisesContext:
                def __enter__(self):
                    return self

                def __exit__(self, exc_type, exc_val, exc_tb):
                    if exc_type is None or not issubclass(exc_type, expected_exception):
                        raise AssertionError(f"Expected {expected_exception}, got {exc_type}")
                    self.value = exc_val
                    return True

            return _RaisesContext()

    pytest = _PytestMock()

from app.core.exceptions import NotFoundError
from app.models.vehiculo import TipoVehiculo, Vehiculo
from app.schemas.vehiculo import VehiculoUpdate
from app.services.vehiculo_service import VehiculoService


def test_delete_y_update_estan_implementados() -> None:
    assert inspect.iscoroutinefunction(VehiculoService.delete)
    assert inspect.iscoroutinefunction(VehiculoService.get_by_id)
    assert inspect.iscoroutinefunction(VehiculoService.update)
    assert "NotImplementedError" not in inspect.getsource(VehiculoService.delete)
    assert "NotImplementedError" not in inspect.getsource(VehiculoService.get_by_id)
    assert "NotImplementedError" not in inspect.getsource(VehiculoService.update)


@pytest.mark.asyncio
async def test_delete_vehiculo_exitoso_por_el_dueno() -> None:
    vehiculo = Vehiculo(
        id=10,
        placa="XYZ999",
        tipo=TipoVehiculo.PARTICULAR,
        alias="Mi carro",
        id_usuario=1,
    )

    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = vehiculo
    db.execute = AsyncMock(return_value=mock_result)
    db.delete = AsyncMock()
    db.flush = AsyncMock()

    service = VehiculoService(db)
    await service.delete(vehiculo_id=10, usuario_id=1)

    db.delete.assert_awaited_once_with(vehiculo)
    db.flush.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_vehiculo_falla_si_no_existe() -> None:
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(return_value=mock_result)

    service = VehiculoService(db)
    with pytest.raises(NotFoundError) as exc_info:
        await service.delete(vehiculo_id=999, usuario_id=1)

    assert exc_info.value.status_code == 404
    assert "no encontrado" in exc_info.value.message.lower()


@pytest.mark.asyncio
async def test_delete_vehiculo_falla_si_pertenece_a_otro_usuario() -> None:
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(return_value=mock_result)

    service = VehiculoService(db)
    with pytest.raises(NotFoundError) as exc_info:
        await service.delete(vehiculo_id=10, usuario_id=2)

    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_update_vehiculo_exitoso() -> None:
    vehiculo = Vehiculo(
        id=10,
        placa="XYZ999",
        tipo=TipoVehiculo.PARTICULAR,
        alias="Carro Viejo",
        id_usuario=1,
    )

    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = vehiculo
    db.execute = AsyncMock(return_value=mock_result)
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    service = VehiculoService(db)
    updated = await service.update(
        vehiculo_id=10,
        payload=VehiculoUpdate(alias="Carro Nuevo", tipo=TipoVehiculo.TAXI),
        usuario_id=1,
    )

    assert updated.alias == "Carro Nuevo"
    assert updated.tipo == TipoVehiculo.TAXI
    db.flush.assert_awaited_once()
    db.refresh.assert_awaited_once_with(vehiculo)

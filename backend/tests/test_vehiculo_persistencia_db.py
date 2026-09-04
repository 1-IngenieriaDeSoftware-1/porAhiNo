"""US-DB-04: insertar vehículo en Postgres (CI)."""

from __future__ import annotations

import time
import uuid

import pytest
from sqlalchemy import select

from app.core.exceptions import ConflictError
from app.models.usuario import RolUsuario, Usuario
from app.models.vehiculo import TipoVehiculo, Vehiculo
from app.schemas.vehiculo import VehiculoCreate
from app.services.vehiculo_service import VehiculoService
from tests.db_support import ensure_schema, requires_postgres, session_factory

pytestmark = requires_postgres


async def _usuario(session, sufijo: str = "") -> Usuario:
    usuario = Usuario(
        email=f"veh-{uuid.uuid4().hex}{sufijo}@test.co",
        password_hash="hash-de-prueba",
        rol=RolUsuario.CONDUCTOR,
    )
    session.add(usuario)
    await session.flush()
    return usuario


@requires_postgres
async def test_insertar_vehiculo_en_menos_de_1_5s() -> None:
    ensure_schema()
    engine, factory = session_factory()
    try:
        async with factory() as session:
            usuario = await _usuario(session)
            servicio = VehiculoService(session)
            payload = VehiculoCreate(
                placa="ABC123",
                tipo=TipoVehiculo.PARTICULAR,
                alias="Mi carro",
            )
            t0 = time.perf_counter()
            vehiculo = await servicio.create(payload, usuario.id)
            elapsed = time.perf_counter() - t0
            await session.commit()

            assert vehiculo.id is not None
            assert vehiculo.placa == "ABC123"
            assert vehiculo.tipo == TipoVehiculo.PARTICULAR
            assert vehiculo.alias == "Mi carro"
            assert vehiculo.id_usuario == usuario.id
            assert elapsed < 1.5
    finally:
        await engine.dispose()


@requires_postgres
async def test_no_permite_la_misma_placa_para_el_mismo_usuario() -> None:
    ensure_schema()
    engine, factory = session_factory()
    try:
        async with factory() as session:
            usuario = await _usuario(session)
            servicio = VehiculoService(session)
            await servicio.create(VehiculoCreate(placa="XYZ987"), usuario.id)
            with pytest.raises(ConflictError):
                await servicio.create(VehiculoCreate(placa="xyz-987"), usuario.id)
    finally:
        await engine.dispose()


@requires_postgres
async def test_la_misma_placa_si_puede_existir_en_otro_usuario() -> None:
    ensure_schema()
    engine, factory = session_factory()
    try:
        async with factory() as session:
            uno = await _usuario(session, "-a")
            dos = await _usuario(session, "-b")
            servicio = VehiculoService(session)
            primero = await servicio.create(VehiculoCreate(placa="DEF456"), uno.id)
            segundo = await servicio.create(VehiculoCreate(placa="DEF456"), dos.id)
            await session.commit()
            assert primero.id != segundo.id
            assert primero.id_usuario != segundo.id_usuario
    finally:
        await engine.dispose()


@requires_postgres
async def test_borrar_usuario_elimina_sus_vehiculos() -> None:
    ensure_schema()
    engine, factory = session_factory()
    try:
        async with factory() as session:
            usuario = await _usuario(session)
            servicio = VehiculoService(session)
            vehiculo = await servicio.create(VehiculoCreate(placa="GHI789"), usuario.id)
            vehiculo_id = vehiculo.id
            await session.commit()

            await session.delete(usuario)
            await session.commit()

            quedo = await session.get(Vehiculo, vehiculo_id)
            assert quedo is None
            filas = (
                await session.execute(select(Vehiculo).where(Vehiculo.id == vehiculo_id))
            ).scalar_one_or_none()
            assert filas is None
    finally:
        await engine.dispose()

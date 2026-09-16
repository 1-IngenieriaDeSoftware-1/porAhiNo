"""US-DB-07: persistir suscripciones de alerta en Postgres (CI)."""

from __future__ import annotations

import uuid

import pytest
from app.core.exceptions import NotFoundError
from app.models.alerta import Alerta
from app.models.usuario import RolUsuario, Usuario
from app.models.vehiculo import TipoVehiculo, Vehiculo
from app.schemas.alerta import AlertaCreate
from app.services.alertas_service import AlertasService
from tests.db_support import ensure_schema, requires_postgres, session_factory

pytestmark = requires_postgres


async def _usuario_y_vehiculo(session, placa: str = "ABC123") -> tuple[Usuario, Vehiculo]:
    usuario = Usuario(
        email=f"alerta-{uuid.uuid4().hex}@test.co",
        password_hash="hash-de-prueba",
        rol=RolUsuario.CONDUCTOR,
    )
    session.add(usuario)
    await session.flush()
    vehiculo = Vehiculo(
        placa=placa,
        tipo=TipoVehiculo.PARTICULAR,
        alias="Prueba",
        id_usuario=usuario.id,
    )
    session.add(vehiculo)
    await session.flush()
    return usuario, vehiculo


@requires_postgres
async def test_suscribir_guarda_usuario_vehiculo_minutos_e_is_active() -> None:
    ensure_schema()
    engine, factory = session_factory()
    try:
        async with factory() as session:
            usuario, vehiculo = await _usuario_y_vehiculo(session)
            alerta = await AlertasService(session).suscribir(
                usuario.id,
                AlertaCreate(id_vehiculo=vehiculo.id, minutos_antes=30),
            )
            await session.commit()

            assert alerta.id is not None
            assert alerta.id_usuario == usuario.id
            assert alerta.id_vehiculo == vehiculo.id
            assert alerta.minutos_antes == 30
            assert alerta.is_active is True
    finally:
        await engine.dispose()


@requires_postgres
async def test_resuscribir_reactiva_sin_duplicar() -> None:
    ensure_schema()
    engine, factory = session_factory()
    try:
        async with factory() as session:
            usuario, vehiculo = await _usuario_y_vehiculo(session, "XYZ987")
            servicio = AlertasService(session)
            primera = await servicio.suscribir(
                usuario.id, AlertaCreate(id_vehiculo=vehiculo.id, minutos_antes=60)
            )
            await servicio.desactivar(primera.id, usuario.id)
            segunda = await servicio.suscribir(
                usuario.id, AlertaCreate(id_vehiculo=vehiculo.id, minutos_antes=15)
            )
            await session.commit()
            assert segunda.id == primera.id
            assert segunda.is_active is True
            assert segunda.minutos_antes == 15
    finally:
        await engine.dispose()


@requires_postgres
async def test_desactivar_conserva_la_fila() -> None:
    ensure_schema()
    engine, factory = session_factory()
    try:
        async with factory() as session:
            usuario, vehiculo = await _usuario_y_vehiculo(session, "DEF456")
            servicio = AlertasService(session)
            alerta = await servicio.suscribir(
                usuario.id, AlertaCreate(id_vehiculo=vehiculo.id)
            )
            alerta_id = alerta.id
            await servicio.desactivar(alerta_id, usuario.id)
            await session.commit()
            recargada = await session.get(Alerta, alerta_id)
            assert recargada is not None
            assert recargada.is_active is False
    finally:
        await engine.dispose()


@requires_postgres
async def test_no_suscribe_vehiculo_ajeno() -> None:
    ensure_schema()
    engine, factory = session_factory()
    try:
        async with factory() as session:
            duenio, vehiculo = await _usuario_y_vehiculo(session, "GHI789")
            otro = Usuario(
                email=f"otro-{uuid.uuid4().hex}@test.co",
                password_hash="hash-de-prueba",
                rol=RolUsuario.CONDUCTOR,
            )
            session.add(otro)
            await session.flush()
            with pytest.raises(NotFoundError):
                await AlertasService(session).suscribir(
                    otro.id, AlertaCreate(id_vehiculo=vehiculo.id)
                )
            assert duenio.id != otro.id
    finally:
        await engine.dispose()

"""US-DB-05: persistir historial de consultas en Postgres (CI)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.core.timezone import ZONA_COLOMBIA
from app.models.municipio import Municipio
from app.models.usuario import RolUsuario, Usuario
from app.services.consulta_service import ConsultaService
from tests.db_support import ensure_schema, requires_postgres, session_factory

pytestmark = requires_postgres


async def _municipio(session) -> Municipio:
    dane = f"9{uuid.uuid4().hex[:4]}"
    municipio = Municipio(nombre="Prueba", departamento="Test", codigo_dane=dane)
    session.add(municipio)
    await session.flush()
    return municipio


@requires_postgres
async def test_consulta_anonima_guarda_fila_con_fks_nulas() -> None:
    ensure_schema()
    engine, factory = session_factory()
    try:
        async with factory() as session:
            municipio = await _municipio(session)
            fecha = datetime(2026, 3, 10, 8, 30, tzinfo=ZONA_COLOMBIA)
            consulta = await ConsultaService(session).registrar_historial(
                placa="abc123",
                municipio_id=municipio.id,
                resultado_restringido=True,
                fecha_verificada=fecha,
            )
            await session.commit()

            assert consulta.id is not None
            assert consulta.municipio_id == municipio.id
            assert consulta.placa_consultada == "ABC123"
            assert consulta.resultado_restringido is True
            assert consulta.fecha_verificada is not None
            assert consulta.id_usuario is None
            assert consulta.id_vehiculo is None
    finally:
        await engine.dispose()


@requires_postgres
async def test_consulta_con_usuario_tambien_se_guarda() -> None:
    ensure_schema()
    engine, factory = session_factory()
    try:
        async with factory() as session:
            municipio = await _municipio(session)
            usuario = Usuario(
                email=f"hist-{uuid.uuid4().hex}@test.co",
                password_hash="hash-de-prueba",
                rol=RolUsuario.CONDUCTOR,
            )
            session.add(usuario)
            await session.flush()

            consulta = await ConsultaService(session).registrar_historial(
                placa="XYZ12D",
                municipio_id=municipio.id,
                resultado_restringido=False,
                fecha_verificada=datetime.now(timezone.utc),
                id_usuario=usuario.id,
            )
            await session.commit()

            assert consulta.id_usuario == usuario.id
            assert consulta.id_vehiculo is None
            assert consulta.placa_consultada == "XYZ12D"
            assert consulta.resultado_restringido is False
            assert consulta.fecha_verificada.tzinfo is not None
    finally:
        await engine.dispose()

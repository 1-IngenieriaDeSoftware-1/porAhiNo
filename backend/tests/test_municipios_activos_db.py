"""US-003.2: GET municipios activos contra Postgres (CI)."""

from __future__ import annotations

import uuid
from datetime import date, time

from app.models.decreto import Decreto
from app.models.municipio import Municipio
from app.schemas.municipio import MunicipioResponse
from app.services.consulta_service import ConsultaService
from tests.db_support import ensure_schema, requires_postgres, session_factory

pytestmark = requires_postgres


def _decreto(municipio_id: int, *, activo: bool, numero: str) -> Decreto:
    return Decreto(
        municipio_id=municipio_id,
        numero_decreto=numero,
        hora_inicio=time(6, 0),
        hora_fin=time(21, 0),
        dias_restriccion="0,1,2,3,4",
        digitos_restringidos="1,2",
        vigencia_desde=date(2026, 1, 1),
        vigencia_hasta=date(2026, 12, 31),
        is_active=activo,
    )


@requires_postgres
async def test_solo_municipios_con_decreto_activo() -> None:
    ensure_schema()
    engine, factory = session_factory()
    sufijo = uuid.uuid4().hex[:6]
    try:
        async with factory() as session:
            con_activo = Municipio(
                nombre="Alpha Activo",
                departamento="Test",
                codigo_dane=f"A{sufijo}",
            )
            solo_inactivo = Municipio(
                nombre="Beta Inactivo",
                departamento="Test",
                codigo_dane=f"B{sufijo}",
            )
            sin_decreto = Municipio(
                nombre="Gamma Vacio",
                departamento="Test",
                codigo_dane=f"C{sufijo}",
            )
            session.add_all([con_activo, solo_inactivo, sin_decreto])
            await session.flush()

            session.add_all(
                [
                    _decreto(con_activo.id, activo=True, numero=f"ACT-{sufijo}"),
                    _decreto(solo_inactivo.id, activo=False, numero=f"INA-{sufijo}"),
                ]
            )
            await session.commit()

            activos = await ConsultaService(session).get_municipios_activos()
            ids = {m.id for m in activos}

            assert con_activo.id in ids
            assert solo_inactivo.id not in ids
            assert sin_decreto.id not in ids

            serializados = [MunicipioResponse.model_validate(m) for m in activos if m.id == con_activo.id]
            assert len(serializados) == 1
            assert serializados[0].nombre == "Alpha Activo"
            assert serializados[0].departamento == "Test"
            assert serializados[0].id == con_activo.id
    finally:
        await engine.dispose()


@requires_postgres
async def test_municipio_con_varios_decretos_aparece_una_vez() -> None:
    ensure_schema()
    engine, factory = session_factory()
    sufijo = uuid.uuid4().hex[:6]
    try:
        async with factory() as session:
            municipio = Municipio(
                nombre="Delta Dup",
                departamento="Test",
                codigo_dane=f"D{sufijo}",
            )
            session.add(municipio)
            await session.flush()
            session.add_all(
                [
                    _decreto(municipio.id, activo=True, numero=f"D1-{sufijo}"),
                    _decreto(municipio.id, activo=True, numero=f"D2-{sufijo}"),
                ]
            )
            await session.commit()

            activos = await ConsultaService(session).get_municipios_activos()
            coincidencias = [m for m in activos if m.id == municipio.id]
            assert len(coincidencias) == 1
    finally:
        await engine.dispose()

"""US-DB-03: seed de decretos contra Postgres (CI)."""

from __future__ import annotations

from sqlalchemy import func, select

from app.data.decretos_r1 import DECRETOS_R1
from app.data.municipios_r1 import CODIGOS_DANE_R1
from app.models.decreto import Decreto
from app.models.municipio import Municipio
from scripts.seed_decretos import seed_decretos
from tests.db_support import ensure_schema, requires_postgres, session_factory

pytestmark = requires_postgres


@requires_postgres
async def test_seed_decretos_no_duplica_y_cubre_cada_municipio() -> None:
    ensure_schema()
    engine, factory = session_factory()
    try:
        async with factory() as session:
            primera = await seed_decretos(session)
            await session.commit()
            segunda = await seed_decretos(session)
            await session.commit()

            numeros = [item["numero_decreto"] for item in DECRETOS_R1]
            total = await session.scalar(
                select(func.count()).select_from(Decreto).where(Decreto.numero_decreto.in_(numeros))
            )
            por_municipio = (
                await session.execute(
                    select(Municipio.codigo_dane, func.count(Decreto.id))
                    .join(Decreto, Decreto.municipio_id == Municipio.id)
                    .where(Municipio.codigo_dane.in_(CODIGOS_DANE_R1), Decreto.is_active.is_(True))
                    .group_by(Municipio.codigo_dane)
                )
            ).all()

        assert primera in (0, len(DECRETOS_R1))
        assert segunda == 0
        assert total == len(DECRETOS_R1)
        cubiertos = {dane for dane, n in por_municipio if n >= 1}
        assert cubiertos == CODIGOS_DANE_R1
    finally:
        await engine.dispose()


@requires_postgres
async def test_seed_persiste_horas_digitos_vigencia() -> None:
    ensure_schema()
    engine, factory = session_factory()
    try:
        async with factory() as session:
            await seed_decretos(session)
            await session.commit()
            numeros = [item["numero_decreto"] for item in DECRETOS_R1]
            filas = (
                await session.execute(select(Decreto).where(Decreto.numero_decreto.in_(numeros)))
            ).scalars().all()

        por_numero = {fila.numero_decreto: fila for fila in filas}
        for item in DECRETOS_R1:
            fila = por_numero[item["numero_decreto"]]
            assert fila.hora_inicio == item["hora_inicio"]
            assert fila.hora_fin == item["hora_fin"]
            assert fila.dias_restriccion == item["dias_restriccion"]
            assert fila.digitos_restringidos == item["digitos_restringidos"]
            assert fila.vigencia_desde == item["vigencia_desde"]
            assert fila.vigencia_hasta == item["vigencia_hasta"]
            assert fila.is_active is True
    finally:
        await engine.dispose()


@requires_postgres
async def test_desactivar_conserva_la_fila() -> None:
    ensure_schema()
    engine, factory = session_factory()
    try:
        async with factory() as session:
            await seed_decretos(session)
            await session.commit()
            decreto = (
                await session.execute(select(Decreto).where(Decreto.numero_decreto == "SEED-BOG-R1"))
            ).scalar_one()
            decreto_id = decreto.id
            decreto.desactivar()
            await session.commit()

            recargado = await session.get(Decreto, decreto_id)
            assert recargado is not None
            assert recargado.is_active is False

            recargado.is_active = True
            await session.commit()
    finally:
        await engine.dispose()

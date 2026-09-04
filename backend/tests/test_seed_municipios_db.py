"""US-DB-02: seed idempotente contra Postgres (CI)."""

from __future__ import annotations

from sqlalchemy import func, select

from app.data.municipios_r1 import CODIGOS_DANE_R1, MUNICIPIOS_R1
from app.models.municipio import Municipio
from scripts.seed_municipios import seed_municipios
from tests.db_support import ensure_schema, requires_postgres, session_factory

pytestmark = requires_postgres


@requires_postgres
async def test_seed_municipios_no_duplica_en_segunda_ejecucion() -> None:
    ensure_schema()
    engine, factory = session_factory()
    try:
        async with factory() as session:
            primera = await seed_municipios(session)
            await session.commit()
            segunda = await seed_municipios(session)
            await session.commit()

            total = await session.scalar(
                select(func.count()).select_from(Municipio).where(
                    Municipio.codigo_dane.in_(CODIGOS_DANE_R1)
                )
            )

        assert primera in (0, len(MUNICIPIOS_R1))
        assert segunda == 0
        assert total == len(MUNICIPIOS_R1)
    finally:
        await engine.dispose()


@requires_postgres
async def test_seed_deja_dane_y_nombres_del_alcance() -> None:
    ensure_schema()
    engine, factory = session_factory()
    try:
        async with factory() as session:
            await seed_municipios(session)
            await session.commit()
            filas = (
                await session.execute(
                    select(Municipio).where(Municipio.codigo_dane.in_(CODIGOS_DANE_R1))
                )
            ).scalars().all()

        por_dane = {fila.codigo_dane: fila for fila in filas}
        for item in MUNICIPIOS_R1:
            fila = por_dane[item["codigo_dane"]]
            assert fila.nombre == item["nombre"]
            assert fila.departamento == item["departamento"]
    finally:
        await engine.dispose()

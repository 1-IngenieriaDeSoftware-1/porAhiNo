"""US-DB-06: EXPLAIN e índice en Postgres (CI). Objetivo query < 1000 ms."""

from __future__ import annotations

import json
import time
import uuid
from datetime import date, time as dtime

from sqlalchemy import inspect, text

from app.models.decreto import Decreto
from app.models.municipio import Municipio
from app.services.consulta_service import ConsultaService
from tests.db_support import ensure_schema, requires_postgres, session_factory

pytestmark = requires_postgres

SQL_CONSULTA = """
SELECT id
FROM decretos
WHERE municipio_id = :mid
  AND is_active = true
  AND vigencia_desde <= :fecha
  AND (vigencia_hasta IS NULL OR vigencia_hasta >= :fecha)
"""


def _nodos(plan: dict):
    yield plan
    for child in plan.get("Plans", []):
        yield from _nodos(child)


@requires_postgres
async def test_upgrade_crea_indices_de_consulta() -> None:
    ensure_schema()
    from sqlalchemy import create_engine
    import os

    engine = create_engine(os.environ["DATABASE_URL_SYNC"])
    try:
        nombres = {idx["name"] for idx in inspect(engine).get_indexes("decretos")}
        assert "ix_decretos_municipio_vigencia" in nombres
        assert "ix_decretos_consulta_vigente" in nombres
    finally:
        engine.dispose()


@requires_postgres
async def test_explain_no_hace_seq_scan_amplio_sobre_decretos() -> None:
    ensure_schema()
    engine, factory = session_factory()
    try:
        async with factory() as session:
            municipio = Municipio(
                nombre="Indice",
                departamento="Test",
                codigo_dane=f"8{uuid.uuid4().hex[:4]}",
            )
            session.add(municipio)
            await session.flush()
            for i in range(80):
                session.add(
                    Decreto(
                        municipio_id=municipio.id,
                        numero_decreto=f"IDX-{i:04d}",
                        hora_inicio=dtime(6, 0),
                        hora_fin=dtime(21, 0),
                        dias_restriccion="0,1,2,3,4",
                        digitos_restringidos="1,2",
                        vigencia_desde=date(2020, 1, 1),
                        vigencia_hasta=date(2026, 12, 31),
                        is_active=True,
                    )
                )
            await session.commit()
            mid = municipio.id

        import os
        from sqlalchemy import create_engine

        sync = create_engine(os.environ["DATABASE_URL_SYNC"])
        try:
            with sync.connect() as conn:
                conn.execute(text("SET enable_seqscan = off"))
                plan_raw = conn.execute(
                    text("EXPLAIN (FORMAT JSON) " + SQL_CONSULTA),
                    {"mid": mid, "fecha": date(2026, 6, 15)},
                ).scalar()
                plan = json.loads(plan_raw) if isinstance(plan_raw, str) else plan_raw
                root = plan[0]["Plan"]
                accesos = [
                    (nodo.get("Node Type"), nodo.get("Relation Name"), nodo.get("Index Name"))
                    for nodo in _nodos(root)
                ]
                seq_decretos = [
                    item
                    for item in accesos
                    if item[0] == "Seq Scan" and item[1] == "decretos"
                ]
                assert not seq_decretos, f"Seq Scan sobre decretos: {accesos}"
                usa_indice = any(
                    item[2]
                    and item[2] in {
                        "ix_decretos_municipio_vigencia",
                        "ix_decretos_consulta_vigente",
                        "ix_decretos_municipio_id",
                    }
                    for item in accesos
                )
                assert usa_indice, f"El plan no usa índice de decretos: {accesos}"
        finally:
            sync.dispose()
    finally:
        await engine.dispose()


@requires_postgres
async def test_buscar_decretos_vigentes_en_menos_de_1s() -> None:
    ensure_schema()
    engine, factory = session_factory()
    try:
        async with factory() as session:
            existente = (
                await session.execute(
                    text("SELECT id FROM municipios WHERE codigo_dane = '11001'")
                )
            ).scalar_one_or_none()
            if existente is None:
                municipio = Municipio(
                    nombre="Bogotá",
                    departamento="Cundinamarca",
                    codigo_dane="11001",
                )
                session.add(municipio)
                await session.flush()
                session.add(
                    Decreto(
                        municipio_id=municipio.id,
                        numero_decreto="SEED-LAT",
                        hora_inicio=dtime(6, 0),
                        hora_fin=dtime(21, 0),
                        dias_restriccion="0,1,2,3,4",
                        digitos_restringidos="1,2",
                        vigencia_desde=date(2026, 1, 1),
                        vigencia_hasta=date(2026, 12, 31),
                        is_active=True,
                    )
                )
                await session.commit()
                mid = municipio.id
            else:
                mid = existente

            servicio = ConsultaService(session)
            t0 = time.perf_counter()
            vigentes = await servicio.buscar_decretos_vigentes(mid, date(2026, 6, 15))
            elapsed_ms = (time.perf_counter() - t0) * 1000
            assert elapsed_ms < 1000
            assert isinstance(vigentes, list)
    finally:
        await engine.dispose()

"""
Pobla la BD local con decretos de prueba estilo Pico y Placa Colombia.

- Asegura municipios R1 (Bogotá, Medellín, Cali)
- Desactiva decretos viejos / de basura de tests
- Inserta DECRETOS_R1 (rotación por día + horarios reales aproximados)

Uso (desde /backend, con Docker Postgres healthy):
  python -m scripts.migrate
  python -m scripts.seed_pruebas
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

load_dotenv(BACKEND_DIR / ".env")

from app.data.decretos_r1 import DECRETOS_R1
from app.data.municipios_r1 import CODIGOS_DANE_R1
from app.models.decreto import Decreto
from app.models.municipio import Municipio
from scripts.seed_decretos import seed_decretos
from scripts.seed_municipios import seed_municipios


async def desactivar_decretos_no_vigentes_r1(session: AsyncSession) -> int:
    """Apaga decretos que no pertenecen al catálogo actual de pruebas R1."""
    numeros_ok = {item["numero_decreto"] for item in DECRETOS_R1}
    mun_ids = (
        await session.execute(
            select(Municipio.id).where(Municipio.codigo_dane.in_(CODIGOS_DANE_R1))
        )
    ).scalars().all()

    result = await session.execute(
        update(Decreto)
        .where(
            Decreto.is_active.is_(True),
            (Decreto.municipio_id.notin_(mun_ids))
            | (Decreto.numero_decreto.notin_(numeros_ok)),
        )
        .values(is_active=False)
        .returning(Decreto.id)
    )
    return len(result.fetchall())


async def seed_pruebas(session: AsyncSession) -> dict[str, int]:
    n_mun = await seed_municipios(session)
    n_off = await desactivar_decretos_no_vigentes_r1(session)
    n_dec = await seed_decretos(session)
    await session.commit()

    activos = (
        await session.execute(
            select(Municipio.nombre, Decreto.numero_decreto, Decreto.digitos_restringidos)
            .join(Decreto, Decreto.municipio_id == Municipio.id)
            .where(Decreto.is_active.is_(True), Municipio.codigo_dane.in_(CODIGOS_DANE_R1))
            .order_by(Municipio.nombre, Decreto.dias_restriccion)
        )
    ).all()

    return {
        "municipios_nuevos": n_mun,
        "decretos_desactivados": n_off,
        "decretos_nuevos": n_dec,
        "activos": len(activos),
        "_filas": activos,
    }


async def _run() -> None:
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as session:
        resumen = await seed_pruebas(session)

    print("Seed de pruebas OK")
    print(f"  municipios nuevos:     {resumen['municipios_nuevos']}")
    print(f"  decretos desactivados: {resumen['decretos_desactivados']}")
    print(f"  decretos nuevos:       {resumen['decretos_nuevos']}")
    print(f"  decretos activos R1:   {resumen['activos']}")
    print("  --- calendario activo ---")
    for nombre, numero, digitos in resumen["_filas"]:
        print(f"  {nombre:12} {numero:14} dígitos {digitos}")


if __name__ == "__main__":
    asyncio.run(_run())

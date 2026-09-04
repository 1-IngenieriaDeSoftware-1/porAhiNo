"""
US-DB-03: persiste decretos de ejemplo (horas, dígitos, vigencia, municipio).

Idempotente por (codigo_dane, numero_decreto, hora_inicio).
Asegura el catálogo R1 antes de insertar.

Uso (desde /backend):
  python -m scripts.seed_decretos
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

load_dotenv(BACKEND_DIR / ".env")

from app.data.decretos_r1 import DECRETOS_R1
from app.models.decreto import Decreto
from app.models.municipio import Municipio
from scripts.seed_municipios import seed_municipios


async def seed_decretos(session: AsyncSession) -> int:
    """Inserta decretos R1. Retorna cuántos se crearon en esta ejecución."""
    await seed_municipios(session)

    creados = 0
    for item in DECRETOS_R1:
        municipio = (
            await session.execute(
                select(Municipio).where(Municipio.codigo_dane == item["codigo_dane"])
            )
        ).scalar_one_or_none()
        if municipio is None:
            raise RuntimeError(
                f"No está el municipio DANE {item['codigo_dane']}. "
                "Ejecuta python -m scripts.seed_municipios"
            )

        existe = (
            await session.execute(
                select(Decreto).where(
                    Decreto.municipio_id == municipio.id,
                    Decreto.numero_decreto == item["numero_decreto"],
                    Decreto.hora_inicio == item["hora_inicio"],
                )
            )
        ).scalar_one_or_none()
        if existe is not None:
            continue

        session.add(
            Decreto(
                municipio_id=municipio.id,
                numero_decreto=item["numero_decreto"],
                descripcion=item["descripcion"],
                hora_inicio=item["hora_inicio"],
                hora_fin=item["hora_fin"],
                dias_restriccion=item["dias_restriccion"],
                digitos_restringidos=item["digitos_restringidos"],
                vigencia_desde=item["vigencia_desde"],
                vigencia_hasta=item["vigencia_hasta"],
                is_active=True,
            )
        )
        creados += 1
    return creados


async def seed(session: AsyncSession) -> None:
    n = await seed_decretos(session)
    await session.commit()
    print(f"Seed OK: {n} decreto(s) nuevos")


async def _run() -> None:
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as session:
        await seed(session)


if __name__ == "__main__":
    asyncio.run(_run())

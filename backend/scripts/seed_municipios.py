"""
US-DB-02: carga el catálogo R1 (Bogotá, Medellín, Cali) de forma idempotente.

Uso (desde /backend, Postgres local arriba y migraciones aplicadas):
  python -m scripts.seed_municipios

Si se ejecuta dos veces no duplica filas: la clave es codigo_dane.
También deja un admin de desarrollo para el panel (US-004).
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

load_dotenv(BACKEND_DIR / ".env")

from app.data.municipios_r1 import MUNICIPIOS_R1
from app.models.municipio import Municipio
from app.models.usuario import RolUsuario, Usuario


async def seed_municipios(session: AsyncSession) -> int:
    """Inserta municipios R1. Retorna cuántos se crearon en esta ejecución."""
    creados = 0
    for item in MUNICIPIOS_R1:
        exists = await session.execute(
            select(Municipio).where(Municipio.codigo_dane == item["codigo_dane"])
        )
        if exists.scalar_one_or_none() is not None:
            continue
        session.add(Municipio(**item))
        creados += 1
    return creados


async def seed_admin_desarrollo(session: AsyncSession) -> bool:
    """Crea el admin local si no existe. Retorna True si lo insertó."""
    from app.core.security import get_password_hash

    admin_email = os.getenv("SEED_ADMIN_EMAIL", "admin@porahino.co")
    admin_pass = os.getenv("SEED_ADMIN_PASSWORD", "Admin1234")
    exists_admin = await session.execute(select(Usuario).where(Usuario.email == admin_email))
    if exists_admin.scalar_one_or_none() is not None:
        return False
    session.add(
        Usuario(
            email=admin_email,
            password_hash=get_password_hash(admin_pass),
            rol=RolUsuario.ADMIN,
        )
    )
    return True


async def seed(session: AsyncSession) -> None:
    n_mun = await seed_municipios(session)
    n_admin = await seed_admin_desarrollo(session)
    await session.commit()
    print(f"Seed OK: {n_mun} municipio(s) nuevos, admin={'sí' if n_admin else 'ya existía'}")


async def _run() -> None:
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as session:
        await seed(session)


if __name__ == "__main__":
    asyncio.run(_run())

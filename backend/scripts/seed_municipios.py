"""
Carga municipios del alcance (Bogotá, Medellín, Cali) y un admin de desarrollo.

Uso (desde /backend, con .env y migraciones aplicadas):
  python -m scripts.seed_municipios
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.municipio import Municipio
from app.models.usuario import RolUsuario, Usuario

MUNICIPIOS = [
    {"nombre": "Bogotá", "departamento": "Cundinamarca", "codigo_dane": "11001"},
    {"nombre": "Medellín", "departamento": "Antioquia", "codigo_dane": "05001"},
    {"nombre": "Cali", "departamento": "Valle del Cauca", "codigo_dane": "76001"},
]


async def seed(session: AsyncSession) -> None:
    for item in MUNICIPIOS:
        exists = await session.execute(
            select(Municipio).where(Municipio.codigo_dane == item["codigo_dane"])
        )
        if exists.scalar_one_or_none() is None:
            session.add(Municipio(**item))

    admin_email = os.getenv("SEED_ADMIN_EMAIL", "admin@porahino.co")
    admin_pass = os.getenv("SEED_ADMIN_PASSWORD", "Admin1234")
    exists_admin = await session.execute(select(Usuario).where(Usuario.email == admin_email))
    if exists_admin.scalar_one_or_none() is None:
        session.add(
            Usuario(
                email=admin_email,
                password_hash=get_password_hash(admin_pass),
                rol=RolUsuario.ADMIN,
            )
        )

    await session.commit()
    print("Seed OK: municipios R1 + admin de desarrollo")


async def main() -> None:
    async with AsyncSessionLocal() as session:
        await seed(session)


if __name__ == "__main__":
    asyncio.run(main())

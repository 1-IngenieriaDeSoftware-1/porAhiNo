"""
US-DB-10 / demo: crea 2 admins (root) + 8 conductores de forma idempotente.

Uso (desde /backend, con .env apuntando a la BD deseada):
  python -m scripts.seed_demo_usuarios

Credenciales de demo (cambiar en producción real):

  Admins (root):
    admin@porahino.co     / Admin1234
    admin2@porahino.co    / Admin1234

  Conductores:
    conductor1@porahino.co … conductor8@porahino.co  / Conductor123
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

from app.core.security import get_password_hash
from app.models.usuario import RolUsuario, Usuario

ADMINS_DEMO = [
    ("admin@porahino.co", "Admin1234"),
    ("admin2@porahino.co", "Admin1234"),
]

CONDUCTORES_DEMO = [
    (f"conductor{i}@porahino.co", "Conductor123") for i in range(1, 9)
]


async def _upsert_usuario(
    session: AsyncSession,
    email: str,
    password: str,
    rol: RolUsuario,
) -> str:
    """Inserta si no existe. Retorna 'creado' | 'existia'."""
    exists = await session.execute(select(Usuario).where(Usuario.email == email))
    if exists.scalar_one_or_none() is not None:
        return "existia"
    session.add(
        Usuario(
            email=email,
            password_hash=get_password_hash(password),
            rol=rol,
            is_active=True,
        )
    )
    return "creado"


async def seed_demo_usuarios(session: AsyncSession) -> dict[str, int]:
    n_admin = 0
    n_cond = 0
    for email, password in ADMINS_DEMO:
        if await _upsert_usuario(session, email, password, RolUsuario.ADMIN) == "creado":
            n_admin += 1
    for email, password in CONDUCTORES_DEMO:
        if await _upsert_usuario(session, email, password, RolUsuario.CONDUCTOR) == "creado":
            n_cond += 1
    await session.commit()
    return {"admins_nuevos": n_admin, "conductores_nuevos": n_cond}


async def _run() -> None:
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as session:
        resumen = await seed_demo_usuarios(session)
    print("Seed demo usuarios OK")
    print(f"  admins nuevos:      {resumen['admins_nuevos']} (objetivo 2)")
    print(f"  conductores nuevos: {resumen['conductores_nuevos']} (objetivo 8)")
    print("  — credenciales en el docstring de este script —")


if __name__ == "__main__":
    asyncio.run(_run())

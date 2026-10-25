"""
Conexión a PostgreSQL vía SQLAlchemy async.
El frontend NUNCA accede directamente a la base de datos.
En esta etapa la BD corre en Docker local (ver docker-compose.yml).
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.base import Base
from app.core.config import settings

# Clever DEV ≈ 5 conexiones; pool chico evita saturar el add-on en demo.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=2,
    max_overflow=1,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

__all__ = ["Base", "engine", "AsyncSessionLocal", "get_db"]


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

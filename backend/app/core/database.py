"""
Conexión a PostgreSQL vía SQLAlchemy async.
El frontend NUNCA accede directamente a la base de datos.
Toda la persistencia ocurre aquí, en el backend.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Motor async (asyncpg driver)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,      # Muestra SQL en consola en desarrollo
    pool_pre_ping=True,       # Valida conexiones antes de usarlas
    pool_size=10,
    max_overflow=20,
)

# Fábrica de sesiones async
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Clase base para todos los modelos SQLAlchemy."""
    pass


async def get_db() -> AsyncSession:
    """
    Dependency de FastAPI para inyectar sesión de base de datos.
    Uso en routers: db: AsyncSession = Depends(get_db)
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

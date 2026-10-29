"""
porAhiNo — FastAPI

Capas:
  routers  → HTTP
  services → reglas de negocio (historias US-001 … US-006)
  models   → persistencia PostgreSQL
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine
from app.core.exceptions import register_exception_handlers
from app.routers import admin, auth, consulta, push, rutas, vehiculos


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Calienta el pool de Postgres para que la primera consulta no pague el cold start.
    async with AsyncSessionLocal() as session:
        await session.execute(text("SELECT 1"))
    yield
    await engine.dispose()


app = FastAPI(
    title="porAhiNo API",
    description="API REST para consulta de Pico y Placa en Colombia",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(vehiculos.router, prefix="/api/v1/vehiculos", tags=["vehiculos"])
app.include_router(consulta.router, prefix="/api/v1/consulta", tags=["consulta"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(rutas.router, prefix="/api/v1/rutas", tags=["rutas-mainv2"])
app.include_router(push.router, prefix="/api/v1/push", tags=["push-mainv2"])


@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "service": "porAhiNo API", "version": "1.0.0"}


@app.get("/api/v1/health", tags=["health"])
async def health_check():
    return {"status": "healthy"}

"""
porAhiNo — FastAPI Application Entry Point

Arquitectura en 3 capas:
  - Routers (controladores HTTP) → app/routers/
  - Services (lógica de negocio) → app/services/
  - Models/Schemas (datos)       → app/models/ & app/schemas/
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, vehiculos, consulta, admin

# ---------------------------------------------------------------------------
# Inicialización de la app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="porAhiNo API",
    description="API REST para consulta de Pico y Placa en Colombia",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# ---------------------------------------------------------------------------
# Middleware CORS
# El frontend (Next.js) consume esta API vía HTTPS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers — cada módulo funcional tiene su propio router
# ---------------------------------------------------------------------------
app.include_router(auth.router,       prefix="/api/v1/auth",       tags=["auth"])
app.include_router(vehiculos.router,  prefix="/api/v1/vehiculos",  tags=["vehiculos"])
app.include_router(consulta.router,   prefix="/api/v1/consulta",   tags=["consulta"])
app.include_router(admin.router,      prefix="/api/v1/admin",      tags=["admin"])


@app.get("/", tags=["health"])
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "porAhiNo API", "version": "1.0.0"}


@app.get("/api/v1/health", tags=["health"])
async def health_check():
    """Endpoint de salud para monitoreo en Render/Railway."""
    return {"status": "healthy"}

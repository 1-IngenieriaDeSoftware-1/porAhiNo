"""
Router: Administración de Decretos (US-004)

Endpoints protegidos con JWT + rol admin.

Endpoints:
  GET    /api/v1/admin/decretos          — Listar decretos
  POST   /api/v1/admin/decretos          — Crear decreto
  GET    /api/v1/admin/decretos/{id}     — Detalle decreto
  PUT    /api/v1/admin/decretos/{id}     — Actualizar decreto
  DELETE /api/v1/admin/decretos/{id}     — Eliminar decreto
  GET    /api/v1/admin/municipios        — Listar municipios
  POST   /api/v1/admin/municipios        — Crear municipio
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.decreto import DecretoCreate, DecretoUpdate, DecretoResponse
from app.services.admin_service import AdminService

router = APIRouter()

# TODO: Agregar dependencia de autorización admin a todos los endpoints
# Ejemplo: current_user = Depends(require_admin_role)

@router.get("/decretos", response_model=List[DecretoResponse])
async def listar_decretos(db: AsyncSession = Depends(get_db)):
    """Lista todos los decretos. Solo admins."""
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.post("/decretos", response_model=DecretoResponse, status_code=status.HTTP_201_CREATED)
async def crear_decreto(payload: DecretoCreate, db: AsyncSession = Depends(get_db)):
    """Crea un nuevo decreto de Pico y Placa. Solo admins."""
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.get("/decretos/{decreto_id}", response_model=DecretoResponse)
async def obtener_decreto(decreto_id: int, db: AsyncSession = Depends(get_db)):
    """Obtiene detalle de un decreto. Solo admins."""
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.put("/decretos/{decreto_id}", response_model=DecretoResponse)
async def actualizar_decreto(
    decreto_id: int, payload: DecretoUpdate, db: AsyncSession = Depends(get_db)
):
    """Actualiza un decreto existente. Solo admins."""
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.delete("/decretos/{decreto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_decreto(decreto_id: int, db: AsyncSession = Depends(get_db)):
    """Elimina un decreto. Solo admins."""
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.get("/municipios")
async def listar_municipios_admin(db: AsyncSession = Depends(get_db)):
    """Lista todos los municipios registrados. Solo admins."""
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.post("/municipios", status_code=status.HTTP_201_CREATED)
async def crear_municipio(db: AsyncSession = Depends(get_db)):
    """Crea un nuevo municipio. Solo admins."""
    raise HTTPException(status_code=501, detail="Not implemented yet")

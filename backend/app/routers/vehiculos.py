"""
Router: Vehículos (US-001, US-006)

Requiere JWT. El conductor solo ve y muta sus propios vehículos.
"""

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.usuario import Usuario
from app.schemas.vehiculo import VehiculoCreate, VehiculoResponse, VehiculoUpdate
from app.services.vehiculo_service import VehiculoService

router = APIRouter()


@router.get("/", response_model=List[VehiculoResponse])
async def listar_vehiculos(
    db: AsyncSession = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    return await VehiculoService(db).get_by_usuario(usuario.id)


@router.post("/", response_model=VehiculoResponse, status_code=status.HTTP_201_CREATED)
async def crear_vehiculo(
    payload: VehiculoCreate,
    db: AsyncSession = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    return await VehiculoService(db).create(payload, usuario.id)


@router.get("/{vehiculo_id}", response_model=VehiculoResponse)
async def obtener_vehiculo(
    vehiculo_id: int,
    db: AsyncSession = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    return await VehiculoService(db).get_by_id(vehiculo_id, usuario.id)


@router.put("/{vehiculo_id}", response_model=VehiculoResponse)
async def actualizar_vehiculo(
    vehiculo_id: int,
    payload: VehiculoUpdate,
    db: AsyncSession = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    return await VehiculoService(db).update(vehiculo_id, payload, usuario.id)


@router.delete("/{vehiculo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_vehiculo(
    vehiculo_id: int,
    db: AsyncSession = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    await VehiculoService(db).delete(vehiculo_id, usuario.id)

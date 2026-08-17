"""
Router: Vehículos (US-001, US-006)

Endpoints:
  GET    /api/v1/vehiculos        — Listar vehículos del usuario
  POST   /api/v1/vehiculos        — Registrar vehículo
  GET    /api/v1/vehiculos/{id}   — Detalle de vehículo
  PUT    /api/v1/vehiculos/{id}   — Actualizar vehículo
  DELETE /api/v1/vehiculos/{id}   — Eliminar vehículo
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.vehiculo import VehiculoCreate, VehiculoUpdate, VehiculoResponse
from app.services.vehiculo_service import VehiculoService

router = APIRouter()


@router.get("/", response_model=List[VehiculoResponse])
async def listar_vehiculos(db: AsyncSession = Depends(get_db)):
    """
    Lista los vehículos del usuario autenticado.
    TODO: Agregar dependencia JWT para obtener id_usuario
    TODO: Implementar VehiculoService.get_by_usuario()
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.post("/", response_model=VehiculoResponse, status_code=status.HTTP_201_CREATED)
async def crear_vehiculo(payload: VehiculoCreate, db: AsyncSession = Depends(get_db)):
    """
    Registra un nuevo vehículo para el usuario autenticado.
    Valida el formato de placa colombiana vía schema Pydantic.
    TODO: Implementar VehiculoService.create()
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.get("/{vehiculo_id}", response_model=VehiculoResponse)
async def obtener_vehiculo(vehiculo_id: int, db: AsyncSession = Depends(get_db)):
    """TODO: Implementar VehiculoService.get_by_id()"""
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.put("/{vehiculo_id}", response_model=VehiculoResponse)
async def actualizar_vehiculo(
    vehiculo_id: int, payload: VehiculoUpdate, db: AsyncSession = Depends(get_db)
):
    """TODO: Implementar VehiculoService.update()"""
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.delete("/{vehiculo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_vehiculo(vehiculo_id: int, db: AsyncSession = Depends(get_db)):
    """TODO: Implementar VehiculoService.delete()"""
    raise HTTPException(status_code=501, detail="Not implemented yet")

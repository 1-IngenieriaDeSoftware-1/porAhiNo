"""
Router: Administración de Decretos (US-004)

Todos los endpoints exigen JWT + rol admin.
"""

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.usuario import Usuario
from app.schemas.decreto import DecretoCreate, DecretoResponse, DecretoUpdate
from app.schemas.municipio import MunicipioCreate, MunicipioResponse
from app.services.admin_service import AdminService

router = APIRouter()


@router.get("/decretos", response_model=List[DecretoResponse])
async def listar_decretos(
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    return await AdminService(db).get_decretos()


@router.post("/decretos", response_model=DecretoResponse, status_code=status.HTTP_201_CREATED)
async def crear_decreto(
    payload: DecretoCreate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    return await AdminService(db).create_decreto(payload)


@router.get("/decretos/{decreto_id}", response_model=DecretoResponse)
async def obtener_decreto(
    decreto_id: int,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    decretos = await AdminService(db).get_decretos()
    match = next((item for item in decretos if item.id == decreto_id), None)
    if match is None:
        from app.core.exceptions import NotFoundError

        raise NotFoundError("Decreto no encontrado")
    return match


@router.put("/decretos/{decreto_id}", response_model=DecretoResponse)
async def actualizar_decreto(
    decreto_id: int,
    payload: DecretoUpdate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    return await AdminService(db).update_decreto(decreto_id, payload)


@router.delete("/decretos/{decreto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_decreto(
    decreto_id: int,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    await AdminService(db).delete_decreto(decreto_id)


@router.get("/municipios", response_model=List[MunicipioResponse])
async def listar_municipios_admin(
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    return await AdminService(db).get_municipios()


@router.post("/municipios", response_model=MunicipioResponse, status_code=status.HTTP_201_CREATED)
async def crear_municipio(
    payload: MunicipioCreate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    return await AdminService(db).create_municipio(
        payload.nombre, payload.departamento, payload.codigo_dane
    )

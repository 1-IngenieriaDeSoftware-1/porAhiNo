"""
Router MainV2: rutas, match GPS, zonas, cámaras, semáforos, geocoding.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.ruta import (
    CamaraResponse,
    GeocodeHit,
    MatchRequest,
    MatchResponse,
    RutaRequest,
    RutaResponse,
    SemaforoResponse,
    ZonaResponse,
)
from app.services.ruta_service import RutaService

router = APIRouter()


@router.post("/", response_model=RutaResponse)
async def calcular_ruta(payload: RutaRequest, db: AsyncSession = Depends(get_db)):
    return await RutaService(db).calcular(payload)


@router.post("/match", response_model=MatchResponse)
async def match_trace(payload: MatchRequest, db: AsyncSession = Depends(get_db)):
    return await RutaService(db).match_trace(payload)


@router.get("/zonas", response_model=List[ZonaResponse])
async def listar_zonas(
    municipio_id: Optional[int] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    return await RutaService(db).listar_zonas(municipio_id)


@router.get("/camaras", response_model=List[CamaraResponse])
async def listar_camaras(
    municipio_id: Optional[int] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    return await RutaService(db).listar_camaras(municipio_id)


@router.get("/semaforos", response_model=List[SemaforoResponse])
async def listar_semaforos(
    municipio_id: Optional[int] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    return await RutaService(db).listar_semaforos(municipio_id)


@router.get("/geocodificar", response_model=List[GeocodeHit])
async def geocodificar(
    q: str = Query(..., min_length=2),
    db: AsyncSession = Depends(get_db),
):
    return await RutaService(db).geocodificar(q)

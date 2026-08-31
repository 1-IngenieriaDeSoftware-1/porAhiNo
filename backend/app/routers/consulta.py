"""
Router: Consulta de Pico y Placa (US-002, US-003)

POST /api/v1/consulta            — Consulta de restricción (pública, <1 s)
GET  /api/v1/consulta/municipios — Municipios con decreto activo (US-003)
"""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.consulta import ConsultaRequest, ConsultaResponse
from app.schemas.municipio import MunicipioResponse
from app.services.consulta_service import ConsultaService

router = APIRouter()


@router.post("/", response_model=ConsultaResponse)
async def consultar_restriccion(
    payload: ConsultaRequest, db: AsyncSession = Depends(get_db)
):
    return await ConsultaService(db).verificar_restriccion(payload)


@router.get("/municipios", response_model=List[MunicipioResponse])
async def listar_municipios(db: AsyncSession = Depends(get_db)):
    return await ConsultaService(db).get_municipios_activos()

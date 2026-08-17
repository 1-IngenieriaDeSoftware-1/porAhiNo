"""
Router: Consulta de Pico y Placa (US-002, US-003)

Endpoints:
  POST /api/v1/consulta           — Consulta de restricción en tiempo real
  GET  /api/v1/consulta/municipios — Lista de municipios disponibles

Requisito de rendimiento: respuesta en <1 segundo.
Usa async/await + índices en columnas de búsqueda frecuente.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.consulta import ConsultaRequest, ConsultaResponse
from app.services.consulta_service import ConsultaService

router = APIRouter()


@router.post("/", response_model=ConsultaResponse)
async def consultar_restriccion(payload: ConsultaRequest, db: AsyncSession = Depends(get_db)):
    """
    Consulta si un vehículo tiene restricción de Pico y Placa.
    Endpoint principal de la aplicación (US-002).
    Optimizado para <1 segundo de respuesta.
    TODO: Implementar ConsultaService.verificar_restriccion()
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.get("/municipios")
async def listar_municipios(db: AsyncSession = Depends(get_db)):
    """
    Lista todos los municipios con decretos de Pico y Placa activos.
    TODO: Implementar ConsultaService.get_municipios_activos()
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")

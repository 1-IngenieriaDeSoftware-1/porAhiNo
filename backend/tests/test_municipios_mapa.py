"""Tests para US-003.3: API de municipios con decreto activo para consulta y mapa."""

from __future__ import annotations

import inspect
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.models.municipio import Municipio
from app.schemas.municipio import MunicipioResponse
from app.services.consulta_service import ConsultaService


def test_consulta_service_tiene_get_municipios_activos() -> None:
    assert inspect.iscoroutinefunction(ConsultaService.get_municipios_activos)
    source = inspect.getsource(ConsultaService.get_municipios_activos)
    assert "Decreto.is_active" in source
    assert "select(Municipio)" in source


@pytest.mark.asyncio
async def test_get_municipios_activos_retorna_lista_dinamica() -> None:
    db = AsyncMock()
    m1 = Municipio(id=1, nombre="Bogotá", departamento="Cundinamarca", codigo_dane="11001")
    m2 = Municipio(id=2, nombre="Medellín", departamento="Antioquia", codigo_dane="05001")
    
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [m1, m2]
    db.execute = AsyncMock(return_value=mock_result)

    service = ConsultaService(db)
    municipios = await service.get_municipios_activos()

    assert len(municipios) == 2
    assert municipios[0].nombre == "Bogotá"
    assert municipios[1].nombre == "Medellín"
    db.execute.assert_awaited_once()


def test_schema_municipio_response_valido_para_mapa() -> None:
    payload = {
        "id": 1,
        "nombre": "Cali",
        "departamento": "Valle del Cauca",
        "codigo_dane": "76001",
    }
    resp = MunicipioResponse.model_validate(payload)
    assert resp.id == 1
    assert resp.nombre == "Cali"
    assert resp.codigo_dane == "76001"

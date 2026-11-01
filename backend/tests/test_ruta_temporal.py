"""Pico y Placa dependiente del tiempo (ETA de entrada a zona)."""

from __future__ import annotations

from datetime import date, datetime, time, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.timezone import ZONA_COLOMBIA
from app.models.decreto import Decreto
from app.models.municipio import Municipio
from app.schemas.ruta import RutaRequest
from app.services.consulta_service import calcular_restriccion
from app.services.ruta_service import RutaService, _offset_entrada_zona_s
from app.services.routing.types import RouteResult


def _decreto_manana() -> Decreto:
    return Decreto(
        id=1,
        municipio_id=1,
        hora_inicio=time(6, 0),
        hora_fin=time(9, 0),
        dias_restriccion="0,1,2,3,4",
        digitos_restringidos="3,4",
        vigencia_desde=date(2026, 1, 1),
        vigencia_hasta=date(2026, 12, 31),
        descripcion="AM",
        is_active=True,
    )


def test_offset_entrada_zona_proporcional():
    # Cuadrado zona; ruta de 4 segmentos iguales en lon, entra en el 3er punto
    zona = [[0.0, 0.0], [2.0, 0.0], [2.0, 2.0], [0.0, 2.0], [0.0, 0.0]]
    # puntos fuera → fuera → dentro → dentro
    coords = [[-1.0, 1.0], [-0.5, 1.0], [0.5, 1.0], [1.5, 1.0]]
    offset = _offset_entrada_zona_s(coords, [zona], duracion_total_s=300.0)
    assert offset is not None
    assert 0 < offset < 300


def test_offset_sin_entrada_devuelve_none():
    zona = [[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], [0.0, 0.0]]
    coords = [[3.0, 3.0], [4.0, 4.0]]
    assert _offset_entrada_zona_s(coords, [zona], 100.0) is None


def test_restriccion_en_eta_no_en_salida():
    """Sale a las 05:30 (sin PyP) pero entra a zona a las 07:00 (con PyP)."""
    decreto = _decreto_manana()
    # Lunes 2026-09-28
    salida = datetime(2026, 9, 28, 5, 30, tzinfo=ZONA_COLOMBIA)
    eta = salida + timedelta(minutes=90)  # 07:00
    assert calcular_restriccion("ABC123", decreto, salida) is False
    assert calcular_restriccion("ABC123", decreto, eta) is True


def test_sin_restriccion_en_eta_aunque_ahora_aplique():
    """Sale en horario restringido pero ETA de zona ya fuera de franja."""
    decreto = _decreto_manana()
    salida = datetime(2026, 9, 28, 8, 30, tzinfo=ZONA_COLOMBIA)
    eta = datetime(2026, 9, 28, 9, 30, tzinfo=ZONA_COLOMBIA)
    assert calcular_restriccion("ABC123", decreto, salida) is True
    assert calcular_restriccion("ABC123", decreto, eta) is False


@pytest.mark.asyncio
async def test_calcular_usa_hora_salida_y_reporta_eta():
    """RutaService.calcular rellena eta_entrada_zona y restriccion_en_eta."""
    mun = Municipio(
        id=1,
        nombre="Medellín",
        departamento="Antioquia",
        bbox_lat_min=6.05,
        bbox_lat_max=6.55,
        bbox_lon_min=-75.75,
        bbox_lon_max=-75.40,
    )
    db = AsyncMock()
    db.get = AsyncMock(return_value=mun)

    # Zona que la ruta directa cruza
    zona_geom = [
        [-75.58, 6.24],
        [-75.56, 6.24],
        [-75.56, 6.26],
        [-75.58, 6.26],
        [-75.58, 6.24],
    ]
    zona_obj = MagicMock()
    zona_obj.geometria = zona_geom
    zonas_result = MagicMock()
    zonas_result.scalars.return_value.all.return_value = [zona_obj]
    db.execute = AsyncMock(return_value=zonas_result)

    directa = RouteResult(
        viable=True,
        distance_m=2000,
        duration_s=600,
        coordinates=[[-75.59, 6.25], [-75.55, 6.25]],
        provider="valhalla",
        mensaje="ok",
    )
    alternativa = RouteResult(
        viable=True,
        distance_m=3000,
        duration_s=900,
        coordinates=[[-75.59, 6.23], [-75.55, 6.23]],
        provider="valhalla",
        mensaje="alt",
    )

    svc = RutaService(db)
    svc._resolver_ruta = AsyncMock(side_effect=[directa, alternativa])  # type: ignore[method-assign]
    svc._zonas_rings = AsyncMock(return_value=[zona_geom])  # type: ignore[method-assign]

    decreto = _decreto_manana()
    salida = datetime(2026, 9, 28, 5, 30, tzinfo=ZONA_COLOMBIA)

    with (
        patch(
            "app.services.ruta_service.ConsultaService.buscar_decretos_vigentes",
            new=AsyncMock(return_value=[decreto]),
        ),
        patch(
            "app.services.ruta_service._offset_entrada_zona_s",
            return_value=5400.0,  # +90 min → ETA 07:00 (dentro de franja)
        ),
    ):
        resp = await svc.calcular(
            RutaRequest(
                origen_lat=6.25,
                origen_lon=-75.59,
                destino_lat=6.25,
                destino_lon=-75.55,
                municipio_id=1,
                placa="ABC123",
                hora_salida=salida,
            )
        )

    assert resp.hora_salida is not None
    assert resp.eta_entrada_zona is not None
    assert resp.restriccion_en_eta is True
    assert resp.restringido is True
    assert len(resp.rutas) == 2
    # Se pidió alternativa (segundo call a _resolver_ruta)
    assert svc._resolver_ruta.await_count == 2

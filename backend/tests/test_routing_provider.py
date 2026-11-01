"""Tests RoutingProvider (Valhalla mock) + cruce 0% + bbox Valle Aburrá."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.municipio import Municipio
from app.services.geo_precision import densificar_polilinea, polilinea_cruza_zonas
from app.services.ruta_service import _ruta_cruza_zonas
from app.services.routing import GraphProvider, LatLon, ValhallaProvider
from app.services.routing.types import RouteResult
from app.services.routing.valhalla_provider import decode_polyline6
from app.services.routing_engine import Nodo


# --- Valhalla mocks ---


@pytest.mark.asyncio
async def test_valhalla_route_ok_polyline6():
    # Encoded trivial: single decode path exercised via mocked JSON with raw coords list
    payload = {
        "trip": {
            "summary": {"length": 1.2, "time": 180},
            "legs": [
                {
                    "shape": [
                        [-75.57, 6.25],
                        [-75.56, 6.26],
                        [-75.55, 6.27],
                    ]
                }
            ],
        }
    }
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = payload

    provider = ValhallaProvider(base_url="http://valhalla.test", timeout=2.0)
    with patch("httpx.AsyncClient") as client_cls:
        client = AsyncMock()
        client.__aenter__.return_value = client
        client.post = AsyncMock(return_value=mock_resp)
        client_cls.return_value = client
        result = await provider.route(
            LatLon(lat=6.25, lon=-75.57),
            LatLon(lat=6.27, lon=-75.55),
            heading=90.0,
        )

    assert result.viable is True
    assert result.provider == "valhalla"
    assert result.distance_m == pytest.approx(1200.0)
    assert result.duration_s == pytest.approx(180.0)
    assert len(result.coordinates) == 3


@pytest.mark.asyncio
async def test_valhalla_route_http_error():
    mock_resp = MagicMock()
    mock_resp.status_code = 503

    provider = ValhallaProvider(base_url="http://valhalla.test")
    with patch("httpx.AsyncClient") as client_cls:
        client = AsyncMock()
        client.__aenter__.return_value = client
        client.post = AsyncMock(return_value=mock_resp)
        client_cls.return_value = client
        result = await provider.route(
            LatLon(lat=6.25, lon=-75.57),
            LatLon(lat=6.27, lon=-75.55),
            avoid_polygons=[[[ -75.6, 6.2], [-75.5, 6.2], [-75.5, 6.3], [-75.6, 6.3]]],
        )

    assert result.viable is False
    assert "503" in result.mensaje


@pytest.mark.asyncio
async def test_valhalla_match_ok():
    payload = {
        "matched_points": [
            {"lat": 6.251, "lon": -75.571, "edge_index": 0},
            {"lat": 6.252, "lon": -75.570, "edge_index": 1},
        ]
    }
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = payload

    provider = ValhallaProvider(base_url="http://valhalla.test")
    with patch("httpx.AsyncClient") as client_cls:
        client = AsyncMock()
        client.__aenter__.return_value = client
        client.post = AsyncMock(return_value=mock_resp)
        client_cls.return_value = client
        result = await provider.match(
            [LatLon(lat=6.25, lon=-75.57), LatLon(lat=6.252, lon=-75.57)]
        )

    assert result.viable is True
    assert len(result.matched) == 2
    assert result.coordinates[0] == [-75.571, 6.251]


@pytest.mark.asyncio
async def test_graph_provider_fallback():
    nodos = {
        1: Nodo(id=1, lat=6.20, lon=-75.60),
        2: Nodo(id=2, lat=6.21, lon=-75.59),
        3: Nodo(id=3, lat=6.22, lon=-75.58),
    }
    aristas = [(1, 2, 150.0, True), (2, 3, 150.0, True)]
    gp = GraphProvider(nodos, aristas)
    result = await gp.route(
        LatLon(lat=6.20, lon=-75.60),
        LatLon(lat=6.22, lon=-75.58),
    )
    assert result.provider == "graph_local"
    assert isinstance(result, RouteResult)


def test_decode_polyline6_roundtrip_empty():
    assert decode_polyline6("") == []


# --- Cruce 0% ---


def test_cruce_umbral_cero_detecta_paso_por_zona():
    zona = [[-75.58, 6.24], [-75.56, 6.24], [-75.56, 6.26], [-75.58, 6.26], [-75.58, 6.24]]
    # Ruta que corta el cuadrado
    ruta = [[-75.59, 6.25], [-75.55, 6.25]]
    assert _ruta_cruza_zonas(ruta, [zona]) is True
    dense = densificar_polilinea(ruta, max_step_m=35.0)
    assert polilinea_cruza_zonas(dense, [zona]) is True


def test_cruce_umbral_cero_ruta_externa_ok():
    zona = [[-75.58, 6.24], [-75.56, 6.24], [-75.56, 6.26], [-75.58, 6.26], [-75.58, 6.24]]
    ruta = [[-75.60, 6.20], [-75.59, 6.21]]
    assert _ruta_cruza_zonas(ruta, [zona]) is False


# --- Bbox Valle de Aburrá ---


def test_bbox_medellin_cubre_valle_aburra():
    """Medellín operativo: Bello/Barbosa N, Caldas/La Estrella S (migración 006)."""
    mun = Municipio(
        nombre="Medellín",
        departamento="Antioquia",
        bbox_lat_min=6.05,
        bbox_lat_max=6.55,
        bbox_lon_min=-75.75,
        bbox_lon_max=-75.40,
    )
    bbox = mun.bbox_tuple()
    assert bbox is not None
    lat_min, lat_max, lon_min, lon_max = bbox
    # Bello ~6.33, Barbosa ~6.44, Caldas ~6.09, La Estrella ~6.16
    assert lat_min <= 6.09 <= lat_max  # Caldas
    assert lat_min <= 6.33 <= lat_max  # Bello
    assert lat_min <= 6.44 <= lat_max  # Barbosa
    assert lon_min <= -75.57 <= lon_max  # centro Medellín


def test_bbox_tuple_none_si_incompleto():
    mun = Municipio(nombre="X", departamento="Y", bbox_lat_min=1.0)
    assert mun.bbox_tuple() is None

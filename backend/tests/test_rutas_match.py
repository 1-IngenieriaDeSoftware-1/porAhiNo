"""Endpoint POST /api/v1/rutas/match."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.schemas.ruta import GeoJSONLineString, MatchPointOut, MatchResponse


@pytest.mark.asyncio
async def test_match_endpoint_ok():
    fake = MatchResponse(
        viable=True,
        mensaje="ok",
        provider="valhalla",
        matched=[MatchPointOut(lat=6.25, lon=-75.57)],
        geometria=GeoJSONLineString(coordinates=[[-75.57, 6.25]]),
    )
    with patch(
        "app.routers.rutas.RutaService.match_trace",
        new=AsyncMock(return_value=fake),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/v1/rutas/match",
                json={
                    "points": [
                        {"lat": 6.25, "lon": -75.57},
                        {"lat": 6.251, "lon": -75.569},
                    ],
                    "municipio_id": 1,
                },
            )
    assert resp.status_code == 200
    body = resp.json()
    assert body["viable"] is True
    assert body["provider"] == "valhalla"
    assert len(body["matched"]) == 1


@pytest.mark.asyncio
async def test_match_endpoint_valida_min_points():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/rutas/match",
            json={"points": [{"lat": 6.25, "lon": -75.57}]},
        )
    assert resp.status_code == 422

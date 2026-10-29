"""
MainV2 — seed idempotente: zonas de alta precisión, cámaras y grafo vial.

  python -m scripts.seed_mainv2
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

load_dotenv(BACKEND_DIR / ".env")

from app.core.database import AsyncSessionLocal
from app.models.camara import Camara
from app.models.grafo_via import AristaVia, NodoVia
from app.models.municipio import Municipio
from app.models.zona_restriccion import ZonaRestriccion
from app.services.routing_engine import haversine_m

ZONAS_PATH = BACKEND_DIR / "data" / "zonas_precision.json"

# Grids de fallback Dijkstra (bbox alineado a polígonos precisos)
CITY_GRIDS = {
    "Bogotá": {"bbox": (4.55, 4.78, -74.18, -74.01), "rows": 9, "cols": 9},
    "Medellín": {"bbox": (6.18, 6.32, -75.63, -75.51), "rows": 8, "cols": 8},
    "Cali": {"bbox": (3.38, 3.51, -76.59, -76.47), "rows": 8, "cols": 8},
}


def _load_zonas() -> dict:
    with ZONAS_PATH.open(encoding="utf-8") as f:
        return json.load(f)


async def _municipio_por_nombre(db: AsyncSession, nombre: str) -> Municipio | None:
    r = await db.execute(select(Municipio).where(Municipio.nombre == nombre))
    return r.scalar_one_or_none()


async def seed_ciudad(db: AsyncSession, mun: Municipio, grid_cfg: dict, zona_cfg: dict) -> None:
    await db.execute(delete(AristaVia).where(AristaVia.municipio_id == mun.id))
    await db.execute(delete(NodoVia).where(NodoVia.municipio_id == mun.id))
    await db.execute(delete(ZonaRestriccion).where(ZonaRestriccion.municipio_id == mun.id))
    await db.execute(delete(Camara).where(Camara.municipio_id == mun.id))
    await db.flush()

    lat_min, lat_max, lon_min, lon_max = grid_cfg["bbox"]
    rows, cols = grid_cfg["rows"], grid_cfg["cols"]
    grid: dict[tuple[int, int], NodoVia] = {}

    for r in range(rows):
        for c in range(cols):
            lat = lat_min + (lat_max - lat_min) * (r / (rows - 1))
            lon = lon_min + (lon_max - lon_min) * (c / (cols - 1))
            nodo = NodoVia(
                municipio_id=mun.id,
                codigo=f"r{r}c{c}",
                lat=round(lat, 6),
                lon=round(lon, 6),
                nombre=f"{mun.nombre} ({r},{c})",
            )
            db.add(nodo)
            grid[(r, c)] = nodo
    await db.flush()

    offsets = [(0, 1), (1, 0), (1, 1), (1, -1)]
    for r in range(rows):
        for c in range(cols):
            a = grid[(r, c)]
            for dr, dc in offsets:
                nr, nc = r + dr, c + dc
                if (nr, nc) not in grid:
                    continue
                b = grid[(nr, nc)]
                dist = haversine_m(a.lat, a.lon, b.lat, b.lon)
                db.add(
                    AristaVia(
                        municipio_id=mun.id,
                        origen_id=a.id,
                        destino_id=b.id,
                        distancia_m=dist,
                        bidireccional=True,
                        nombre=f"{a.codigo}-{b.codigo}",
                    )
                )

    geom = zona_cfg["geometria"]
    if geom[0] != geom[-1]:
        geom = list(geom) + [geom[0]]

    db.add(
        ZonaRestriccion(
            municipio_id=mun.id,
            nombre=zona_cfg.get("nombre", f"Zona Pico y Placa {mun.nombre}"),
            geometria=geom,
            descripcion=zona_cfg.get("descripcion"),
            is_active=True,
        )
    )

    for item in zona_cfg.get("camaras", []):
        nombre, lat, lon = item[0], item[1], item[2]
        db.add(
            Camara(
                municipio_id=mun.id,
                nombre=nombre,
                lat=lat,
                lon=lon,
                tipo="fotomulta",
                fuente="seed MainV2 precisión",
                is_active=True,
            )
        )

    await db.flush()
    print(
        f"  ✓ {mun.nombre}: zona {len(geom)} pts, "
        f"{rows*cols} nodos fallback, {len(zona_cfg.get('camaras', []))} cámaras"
    )


async def main() -> None:
    data = _load_zonas()
    async with AsyncSessionLocal() as db:
        for nombre, grid_cfg in CITY_GRIDS.items():
            mun = await _municipio_por_nombre(db, nombre)
            if not mun:
                print(f"  ✗ Municipio '{nombre}' no existe — corre seed_municipios primero")
                continue
            zona_cfg = data.get(nombre)
            if not zona_cfg:
                print(f"  ✗ Sin geometría precisa para {nombre} en {ZONAS_PATH.name}")
                continue
            await seed_ciudad(db, mun, grid_cfg, zona_cfg)
        await db.commit()
    print("Seed MainV2 precisión listo.")


if __name__ == "__main__":
    asyncio.run(main())

"""
Extrae nodos OSM highway=traffic_signals del Valle de Aburrá vía Overpass
e inserta en tabla semaforos (migración 006).

  python -m scripts.seed_semaforos_osm

No inventa fases de semáforo: solo coordenadas para capa mapa / costing.
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))
load_dotenv(BACKEND_DIR / ".env")

from app.core.database import AsyncSessionLocal
from app.models.municipio import Municipio
from app.models.semaforo import Semaforo

# Valle de Aburrá (mismo bbox operativo Medellín)
BBOX = (6.05, -75.75, 6.55, -75.40)  # south, west, north, east
OVERPASS = "https://overpass-api.de/api/interpreter"

QUERY = f"""
[out:json][timeout:90];
node["highway"="traffic_signals"]({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]});
out body;
"""


async def fetch_osm_signals() -> list[dict]:
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(OVERPASS, data={"data": QUERY})
        resp.raise_for_status()
        data = resp.json()
    out = []
    for el in data.get("elements") or []:
        if el.get("type") != "node":
            continue
        lat, lon = el.get("lat"), el.get("lon")
        if lat is None or lon is None:
            continue
        tags = el.get("tags") or {}
        out.append(
            {
                "osm_id": int(el["id"]),
                "lat": float(lat),
                "lon": float(lon),
                "nombre": tags.get("name") or tags.get("ref"),
            }
        )
    return out


async def seed(db: AsyncSession, signals: list[dict]) -> int:
    mun = (
        await db.execute(select(Municipio).where(Municipio.nombre == "Medellín"))
    ).scalar_one_or_none()
    mid = mun.id if mun else None
    await db.execute(delete(Semaforo).where(Semaforo.municipio_id == mid))
    await db.flush()
    for s in signals:
        db.add(
            Semaforo(
                municipio_id=mid,
                osm_id=s["osm_id"],
                lat=s["lat"],
                lon=s["lon"],
                nombre=s["nombre"],
                is_active=True,
            )
        )
    await db.commit()
    return len(signals)


async def main() -> None:
    print("Consultando Overpass (traffic_signals Valle de Aburrá)...")
    try:
        signals = await fetch_osm_signals()
    except Exception as exc:  # noqa: BLE001
        print(f"Overpass falló ({exc}). Insertando semilla mínima offline.")
        signals = [
            {"osm_id": 1, "lat": 6.2476, "lon": -75.5658, "nombre": "Centro demo"},
            {"osm_id": 2, "lat": 6.2087, "lon": -75.5678, "nombre": "Poblado demo"},
            {"osm_id": 3, "lat": 6.2730, "lon": -75.5770, "nombre": "Universidad demo"},
        ]
    async with AsyncSessionLocal() as db:
        n = await seed(db, signals)
    print(f"✓ {n} semáforos en BD (municipio Medellín / Valle de Aburrá).")


if __name__ == "__main__":
    asyncio.run(main())

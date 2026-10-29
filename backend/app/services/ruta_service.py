"""Orquesta restricción + rutas por vías (OSRM) + fallback grafo (MainV2)."""

from __future__ import annotations

from typing import List, Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import AppError
from app.core.placa import validar_placa
from app.core.timezone import ahora_colombia
from app.models.camara import Camara
from app.models.grafo_via import AristaVia, NodoVia
from app.models.municipio import Municipio
from app.models.zona_restriccion import ZonaRestriccion
from app.schemas.consulta import ConsultaRequest
from app.schemas.ruta import (
    CamaraResponse,
    GeoJSONLineString,
    GeocodeHit,
    RutaOpcion,
    RutaRequest,
    RutaResponse,
    ZonaResponse,
)
from app.services.consulta_service import ConsultaService
from app.services.osrm_client import ruta_por_vias
from app.services.routing_engine import Nodo, ResultadoRuta, calcular_ruta, haversine_m

# Bboxes aproximados (lat_min, lat_max, lon_min, lon_max) — puntos deben caer aquí
CITY_BBOX: dict[str, tuple[float, float, float, float]] = {
    # Alineados a polígonos de data/zonas_precision.json (+ margen)
    "Bogotá": (4.52, 4.80, -74.20, -73.99),
    "Medellín": (6.16, 6.34, -75.65, -75.50),
    "Cali": (3.36, 3.53, -76.60, -76.45),
}
MAX_DISTANCIA_PUNTOS_M = 80_000  # 80 km: evita Bogotá→Medellín en una sola ciudad


class RutaService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def calcular(self, payload: RutaRequest) -> RutaResponse:
        mun = await self.db.get(Municipio, payload.municipio_id)
        if not mun:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("Municipio no encontrado")

        self._validar_puntos_ciudad(
            mun.nombre,
            payload.origen_lat,
            payload.origen_lon,
            payload.destino_lat,
            payload.destino_lon,
        )

        fecha_hora = payload.fecha_hora or ahora_colombia()
        placa = validar_placa(payload.placa) if payload.placa else None
        restringido = False
        mensaje_rest = "Sin placa: se muestran ambas rutas (informativo)."

        if placa:
            consulta = await ConsultaService(self.db).verificar_restriccion(
                ConsultaRequest(
                    placa=placa,
                    municipio_id=payload.municipio_id,
                    fecha_hora=fecha_hora,
                ),
                usuario=None,
            )
            restringido = bool(consulta.tiene_restriccion)
            mensaje_rest = consulta.mensaje

        zonas_rings = await self._zonas_rings(payload.municipio_id)

        directa = await self._resolver_ruta(
            payload,
            zonas_bloqueo=None,
            evita_restriccion=False,
            municipio_id=payload.municipio_id,
        )
        alternativa = await self._resolver_ruta(
            payload,
            zonas_bloqueo=zonas_rings,
            evita_restriccion=True,
            municipio_id=payload.municipio_id,
        )

        rutas: list[RutaOpcion] = [
            self._a_opcion("directa", directa),
            self._a_opcion("alternativa", alternativa),
        ]

        diff = None
        if directa.viable and alternativa.viable:
            diff = round((alternativa.duracion_s - directa.duracion_s) / 60, 1)

        return RutaResponse(
            municipio=mun.nombre,
            placa=placa,
            restringido=restringido,
            mensaje_restriccion=mensaje_rest,
            diferencia_min=diff,
            rutas=rutas,
        )

    def _validar_puntos_ciudad(
        self,
        nombre: str,
        o_lat: float,
        o_lon: float,
        d_lat: float,
        d_lon: float,
    ) -> None:
        dist = haversine_m(o_lat, o_lon, d_lat, d_lon)
        if dist > MAX_DISTANCIA_PUNTOS_M:
            raise AppError(
                f"Origen y destino están a {dist/1000:.0f} km. "
                "Marca ambos puntos dentro del mismo municipio (ej. solo Bogotá).",
                422,
            )
        bbox = CITY_BBOX.get(nombre)
        if not bbox:
            return
        lat_min, lat_max, lon_min, lon_max = bbox

        def inside(lat: float, lon: float) -> bool:
            return lat_min <= lat <= lat_max and lon_min <= lon <= lon_max

        if not inside(o_lat, o_lon) or not inside(d_lat, d_lon):
            raise AppError(
                f"Origen y destino deben estar dentro del área de {nombre}. "
                "Cambia el municipio o vuelve a marcar los puntos en el mapa de esa ciudad.",
                422,
            )

    async def _resolver_ruta(
        self,
        payload: RutaRequest,
        *,
        zonas_bloqueo: list[list[list[float]]] | None,
        evita_restriccion: bool,
        municipio_id: int,
    ) -> ResultadoRuta:
        # 1) Vías reales vía OSRM
        osrm = await ruta_por_vias(
            payload.origen_lat,
            payload.origen_lon,
            payload.destino_lat,
            payload.destino_lon,
            zonas_bloqueo=zonas_bloqueo,
            evita_restriccion=evita_restriccion,
        )
        if osrm.viable and len(osrm.coordenadas) >= 2:
            return osrm

        # 2) Fallback: grafo Dijkstra local del municipio
        nodos, aristas = await self._cargar_grafo(municipio_id)
        local = calcular_ruta(
            nodos,
            aristas,
            payload.origen_lat,
            payload.origen_lon,
            payload.destino_lat,
            payload.destino_lon,
            zonas_bloqueo=zonas_bloqueo,
            evita_restriccion=evita_restriccion,
        )
        if local.viable:
            local.mensaje = f"{local.mensaje} (fallback grafo local)"
            return local
        # Preferir mensaje OSRM si explicó el fallo de desvío
        if osrm.mensaje:
            return osrm
        return local

    def _a_opcion(self, tipo: str, r: ResultadoRuta) -> RutaOpcion:
        return RutaOpcion(
            tipo=tipo,
            viable=r.viable,
            distancia_m=round(r.distancia_m, 1),
            duracion_s=round(r.duracion_s, 1),
            duracion_min=round(r.duracion_s / 60, 1),
            mensaje=r.mensaje,
            geometria=GeoJSONLineString(coordinates=r.coordenadas or []),
            evita_restriccion=r.evita_restriccion,
        )

    async def _zonas_rings(self, municipio_id: int) -> list[list[list[float]]]:
        result = await self.db.execute(
            select(ZonaRestriccion).where(
                ZonaRestriccion.municipio_id == municipio_id,
                ZonaRestriccion.is_active.is_(True),
            )
        )
        return [list(z.geometria) for z in result.scalars().all()]

    async def _cargar_grafo(self, municipio_id: int):
        nres = await self.db.execute(select(NodoVia).where(NodoVia.municipio_id == municipio_id))
        nodos_db = list(nres.scalars().all())
        nodos = {n.id: Nodo(id=n.id, lat=n.lat, lon=n.lon) for n in nodos_db}

        ares = await self.db.execute(
            select(AristaVia).where(AristaVia.municipio_id == municipio_id)
        )
        aristas = [
            (a.origen_id, a.destino_id, a.distancia_m, bool(a.bidireccional))
            for a in ares.scalars().all()
        ]
        return nodos, aristas

    async def listar_zonas(self, municipio_id: Optional[int] = None) -> List[ZonaResponse]:
        stmt = (
            select(ZonaRestriccion)
            .options(selectinload(ZonaRestriccion.municipio))
            .where(ZonaRestriccion.is_active.is_(True))
        )
        if municipio_id:
            stmt = stmt.where(ZonaRestriccion.municipio_id == municipio_id)
        result = await self.db.execute(stmt)
        out: list[ZonaResponse] = []
        for z in result.scalars().all():
            out.append(
                ZonaResponse(
                    id=z.id,
                    municipio_id=z.municipio_id,
                    municipio=z.municipio.nombre if z.municipio else "",
                    nombre=z.nombre,
                    geometria=list(z.geometria),
                    descripcion=z.descripcion,
                )
            )
        return out

    async def listar_camaras(self, municipio_id: Optional[int] = None) -> List[CamaraResponse]:
        stmt = (
            select(Camara)
            .options(selectinload(Camara.municipio))
            .where(Camara.is_active.is_(True))
        )
        if municipio_id:
            stmt = stmt.where(Camara.municipio_id == municipio_id)
        result = await self.db.execute(stmt)
        out: list[CamaraResponse] = []
        for c in result.scalars().all():
            out.append(
                CamaraResponse(
                    id=c.id,
                    municipio_id=c.municipio_id,
                    municipio=c.municipio.nombre if c.municipio else None,
                    nombre=c.nombre,
                    lat=c.lat,
                    lon=c.lon,
                    tipo=c.tipo,
                    fuente=c.fuente,
                )
            )
        return out

    async def geocodificar(self, q: str, limit: int = 5) -> List[GeocodeHit]:
        if not q.strip():
            return []
        url = "https://nominatim.openstreetmap.org/search"
        params = {"q": q, "format": "json", "limit": limit, "countrycodes": "co"}
        headers = {"User-Agent": "porAhiNo-MainV2/1.0 (demo academica)"}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params, headers=headers)
                resp.raise_for_status()
                data = resp.json()
        except Exception:
            return []
        hits: list[GeocodeHit] = []
        for item in data:
            hits.append(
                GeocodeHit(
                    display_name=item.get("display_name", q),
                    lat=float(item["lat"]),
                    lon=float(item["lon"]),
                    extra={"type": item.get("type"), "osm_id": item.get("osm_id")},
                )
            )
        return hits

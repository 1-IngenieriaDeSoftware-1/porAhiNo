"""Orquesta Pico y Placa temporal + Valhalla (+ grafo local) — MainV2."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import List, Optional, Sequence

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.exceptions import AppError, NotFoundError
from app.core.placa import validar_placa
from app.core.timezone import a_colombia, ahora_colombia
from app.models.camara import Camara
from app.models.grafo_via import AristaVia, NodoVia
from app.models.municipio import Municipio
from app.models.semaforo import Semaforo
from app.models.zona_restriccion import ZonaRestriccion
from app.schemas.consulta import ConsultaRequest
from app.schemas.ruta import (
    CamaraResponse,
    GeoJSONLineString,
    GeocodeHit,
    MatchPointOut,
    MatchRequest,
    MatchResponse,
    RutaOpcion,
    RutaRequest,
    RutaResponse,
    SemaforoResponse,
    ZonaResponse,
)
from app.services.consulta_service import ConsultaService, calcular_restriccion
from app.services.geo_precision import densificar_polilinea, polilinea_cruza_zonas
from app.services.routing import GraphProvider, LatLon, ValhallaProvider
from app.services.routing.types import RouteResult
from app.services.routing_engine import Nodo, haversine_m, punto_en_alguna_zona

MAX_DISTANCIA_PUNTOS_M = 80_000


def _ruta_cruza_zonas(
    coords: Sequence[Sequence[float]],
    zonas: Sequence[Sequence[Sequence[float]]],
) -> bool:
    """Umbral 0%: cualquier cruce (densificado + intersección) invalida."""
    if not zonas or len(coords) < 2:
        return False
    dense = densificar_polilinea(coords, max_step_m=35.0)
    return polilinea_cruza_zonas(dense, zonas)


def _offset_entrada_zona_s(
    coords: Sequence[Sequence[float]],
    zonas: Sequence[Sequence[Sequence[float]]],
    duracion_total_s: float,
) -> Optional[float]:
    """Estima segundos desde el origen hasta el primer punto dentro de zona."""
    if not coords or not zonas or duracion_total_s <= 0:
        return None
    dense = densificar_polilinea(coords, max_step_m=25.0)
    if len(dense) < 2:
        return None
    total = 0.0
    segs: list[float] = []
    for i in range(1, len(dense)):
        d = haversine_m(dense[i - 1][1], dense[i - 1][0], dense[i][1], dense[i][0])
        segs.append(d)
        total += d
    if total <= 0:
        return None
    acc = 0.0
    for i, d in enumerate(segs):
        lon, lat = dense[i + 1][0], dense[i + 1][1]
        if punto_en_alguna_zona(lon, lat, zonas):
            return duracion_total_s * (acc / total)
        acc += d
    return None


class RutaService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.valhalla = ValhallaProvider(
            base_url=settings.VALHALLA_BASE_URL,
            timeout=float(settings.VALHALLA_TIMEOUT_S),
        )
        self.max_detour = float(settings.ROUTING_MAX_DETOR_FACTOR)

    async def calcular(self, payload: RutaRequest) -> RutaResponse:
        mun = await self.db.get(Municipio, payload.municipio_id)
        if not mun:
            raise NotFoundError("Municipio no encontrado")

        self._validar_puntos_ciudad(
            mun,
            payload.origen_lat,
            payload.origen_lon,
            payload.destino_lat,
            payload.destino_lon,
        )

        hora_salida = a_colombia(payload.hora_salida) if payload.hora_salida else ahora_colombia()
        if payload.fecha_hora and not payload.hora_salida:
            hora_salida = a_colombia(payload.fecha_hora)

        placa = validar_placa(payload.placa) if payload.placa else None
        zonas_rings = await self._zonas_rings(payload.municipio_id)
        heading = payload.heading

        directa = await self._resolver_ruta(
            payload.origen_lat,
            payload.origen_lon,
            payload.destino_lat,
            payload.destino_lon,
            municipio_id=payload.municipio_id,
            zonas_bloqueo=None,
            evita_restriccion=False,
            heading=heading,
        )

        eta_entrada: Optional[datetime] = None
        restriccion_en_eta: Optional[bool] = None
        necesita_alternativa = False
        mensaje_rest = "Sin placa: se muestran ambas rutas (informativo)."
        restringido = False

        if not placa:
            necesita_alternativa = True
        else:
            offset_s = _offset_entrada_zona_s(
                directa.coordinates if directa.viable else [],
                zonas_rings,
                directa.duration_s if directa.viable else 0,
            )
            if offset_s is None:
                consulta_ahora = await ConsultaService(self.db).verificar_restriccion(
                    ConsultaRequest(
                        placa=placa,
                        municipio_id=payload.municipio_id,
                        fecha_hora=hora_salida,
                    ),
                    usuario=None,
                )
                restringido = bool(consulta_ahora.tiene_restriccion)
                mensaje_rest = consulta_ahora.mensaje
                necesita_alternativa = False
            else:
                eta_entrada = hora_salida + timedelta(seconds=offset_s)
                decretos = await ConsultaService(self.db).buscar_decretos_vigentes(
                    payload.municipio_id, eta_entrada.date()
                )
                restriccion_en_eta = any(
                    calcular_restriccion(placa, d, eta_entrada) for d in decretos
                )
                restringido = bool(restriccion_en_eta)
                if restriccion_en_eta:
                    mensaje_rest = (
                        f"Restricción activa a la hora estimada de entrada a la zona "
                        f"({eta_entrada.strftime('%H:%M')}). Se calcula alternativa."
                    )
                    necesita_alternativa = True
                else:
                    mensaje_rest = (
                        f"Sin restricción a la hora estimada de entrada a la zona "
                        f"({eta_entrada.strftime('%H:%M')})."
                    )
                    necesita_alternativa = False

        if necesita_alternativa:
            alternativa = await self._resolver_ruta(
                payload.origen_lat,
                payload.origen_lon,
                payload.destino_lat,
                payload.destino_lon,
                municipio_id=payload.municipio_id,
                zonas_bloqueo=zonas_rings,
                evita_restriccion=True,
                heading=heading,
                referencia_directa=directa if directa.viable else None,
            )
        else:
            alternativa = RouteResult(
                viable=directa.viable,
                distance_m=directa.distance_m if directa.viable else 0,
                duration_s=directa.duration_s if directa.viable else 0,
                coordinates=list(directa.coordinates) if directa.viable else [],
                provider=directa.provider if directa.viable else "",
                mensaje="Alternativa no requerida (sin restricción en ETA de zona)",
            )

        rutas: list[RutaOpcion] = [
            self._a_opcion("directa", directa, evita=False),
            self._a_opcion("alternativa", alternativa, evita=necesita_alternativa),
        ]

        diff = None
        if directa.viable and alternativa.viable and necesita_alternativa:
            diff = round((alternativa.duration_s - directa.duration_s) / 60, 1)

        return RutaResponse(
            municipio=mun.nombre,
            placa=placa,
            restringido=restringido,
            mensaje_restriccion=mensaje_rest,
            diferencia_min=diff,
            rutas=rutas,
            hora_salida=hora_salida,
            eta_entrada_zona=eta_entrada,
            restriccion_en_eta=restriccion_en_eta,
        )

    def _validar_puntos_ciudad(
        self,
        mun: Municipio,
        o_lat: float,
        o_lon: float,
        d_lat: float,
        d_lon: float,
    ) -> None:
        dist = haversine_m(o_lat, o_lon, d_lat, d_lon)
        if dist > MAX_DISTANCIA_PUNTOS_M:
            raise AppError(
                f"Origen y destino están a {dist/1000:.0f} km. "
                "Marca ambos puntos dentro del mismo municipio.",
                422,
            )
        bbox = mun.bbox_tuple()
        if not bbox:
            return
        lat_min, lat_max, lon_min, lon_max = bbox

        def inside(lat: float, lon: float) -> bool:
            return lat_min <= lat <= lat_max and lon_min <= lon <= lon_max

        if not inside(o_lat, o_lon) or not inside(d_lat, d_lon):
            raise AppError(
                f"Origen y destino deben estar dentro del área operativa de {mun.nombre}.",
                422,
            )

    async def _resolver_ruta(
        self,
        o_lat: float,
        o_lon: float,
        d_lat: float,
        d_lon: float,
        *,
        municipio_id: int,
        zonas_bloqueo: list[list[list[float]]] | None,
        evita_restriccion: bool,
        heading: Optional[float],
        referencia_directa: Optional[RouteResult] = None,
    ) -> RouteResult:
        origin = LatLon(lat=o_lat, lon=o_lon)
        dest = LatLon(lat=d_lat, lon=d_lon)
        avoid = list(zonas_bloqueo) if (evita_restriccion and zonas_bloqueo) else None

        candidata = await self.valhalla.route(
            origin,
            dest,
            avoid_polygons=avoid,
            heading=heading,
        )

        if not candidata.viable:
            nodos, aristas = await self._cargar_grafo(municipio_id)
            candidata = await GraphProvider(nodos, aristas).route(
                origin, dest, avoid_polygons=avoid, heading=heading
            )

        if not candidata.viable:
            return RouteResult(
                viable=False,
                provider=candidata.provider or "none",
                mensaje=candidata.mensaje
                or "No se encontró ruta viable que cumpla las restricciones",
            )

        if evita_restriccion and avoid and _ruta_cruza_zonas(candidata.coordinates, avoid):
            return RouteResult(
                viable=False,
                provider=candidata.provider,
                distance_m=candidata.distance_m,
                duration_s=candidata.duration_s,
                coordinates=[],
                mensaje="No hay alternativa válida sin cruzar la zona restringida",
            )

        if (
            evita_restriccion
            and referencia_directa
            and referencia_directa.viable
            and referencia_directa.duration_s > 0
            and candidata.duration_s > referencia_directa.duration_s * self.max_detour
        ):
            return RouteResult(
                viable=False,
                provider=candidata.provider,
                mensaje=(
                    f"Desvío excesivo (>{self.max_detour:.1f}x la ruta directa). "
                    "No se ofrece alternativa engañosa."
                ),
            )

        msg = candidata.mensaje
        if evita_restriccion:
            msg = f"{msg} evitando zona (cruce 0%)"
        return RouteResult(
            viable=True,
            distance_m=candidata.distance_m,
            duration_s=candidata.duration_s,
            coordinates=candidata.coordinates,
            provider=candidata.provider,
            mensaje=msg,
        )

    def _a_opcion(self, tipo: str, r: RouteResult, *, evita: bool) -> RutaOpcion:
        return RutaOpcion(
            tipo=tipo,
            viable=r.viable,
            distancia_m=round(r.distance_m, 1),
            duracion_s=round(r.duration_s, 1),
            duracion_min=round(r.duration_s / 60, 1) if r.duration_s else 0.0,
            mensaje=r.mensaje,
            geometria=GeoJSONLineString(coordinates=r.coordinates or []),
            evita_restriccion=evita and r.viable,
            provider=r.provider,
        )

    async def match_trace(self, payload: MatchRequest) -> MatchResponse:
        trace = [LatLon(lat=p.lat, lon=p.lon) for p in payload.points]
        result = await self.valhalla.match(trace)
        if not result.viable and payload.municipio_id:
            nodos, aristas = await self._cargar_grafo(payload.municipio_id)
            result = await GraphProvider(nodos, aristas).match(trace)
        return MatchResponse(
            viable=result.viable,
            mensaje=result.mensaje,
            provider=result.provider,
            matched=[MatchPointOut(lat=m.lat, lon=m.lon) for m in result.matched],
            geometria=GeoJSONLineString(coordinates=result.coordinates or []),
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

    async def listar_semaforos(
        self, municipio_id: Optional[int] = None
    ) -> List[SemaforoResponse]:
        stmt = select(Semaforo).where(Semaforo.is_active.is_(True))
        if municipio_id:
            stmt = stmt.where(Semaforo.municipio_id == municipio_id)
        result = await self.db.execute(stmt)
        return [
            SemaforoResponse(
                id=s.id,
                municipio_id=s.municipio_id,
                lat=s.lat,
                lon=s.lon,
                nombre=s.nombre,
                osm_id=s.osm_id,
            )
            for s in result.scalars().all()
        ]

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

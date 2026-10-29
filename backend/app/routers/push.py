"""Web Push — suscripción y avisos día antes (MainV2)."""

from __future__ import annotations

import json
import os
from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.core.timezone import ahora_colombia
from app.models.alerta import Alerta
from app.models.push_subscription import PushSubscription
from app.models.usuario import Usuario
from app.models.vehiculo import Vehiculo
from app.schemas.consulta import ConsultaRequest
from app.schemas.ruta import PushSubscribeRequest
from app.services.consulta_service import ConsultaService

router = APIRouter()


@router.get("/vapid-public-key")
async def vapid_public_key():
    key = os.getenv("VAPID_PUBLIC_KEY", "")
    return {"publicKey": key, "configured": bool(key)}


@router.post("/subscribe")
async def subscribe(
    payload: PushSubscribeRequest,
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    p256dh = payload.keys.get("p256dh") or payload.keys.get("p256DH")
    auth = payload.keys.get("auth")
    if not p256dh or not auth:
        from app.core.exceptions import AppError

        raise AppError("Faltan keys p256dh/auth", 422)

    existing = await db.execute(
        select(PushSubscription).where(PushSubscription.endpoint == payload.endpoint)
    )
    sub = existing.scalar_one_or_none()
    if sub:
        sub.usuario_id = usuario.id
        sub.p256dh = p256dh
        sub.auth = auth
        sub.user_agent = payload.user_agent
    else:
        db.add(
            PushSubscription(
                usuario_id=usuario.id,
                endpoint=payload.endpoint,
                p256dh=p256dh,
                auth=auth,
                user_agent=payload.user_agent,
            )
        )
    await db.flush()
    return {"ok": True}


@router.post("/avisos-manana")
async def avisos_manana(
    _admin: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Recorre alertas activas y, si mañana la placa tiene restricción
    en algún municipio seed, encola/envía push (si VAPID configurado).
    """
    manana = ahora_colombia() + timedelta(days=1)
    # Probar a mediodía para caer en horario típico de restricción
    manana_mediodia = manana.replace(hour=12, minute=0, second=0, microsecond=0)

    alertas = (
        await db.execute(
            select(Alerta)
            .where(Alerta.is_active.is_(True))
        )
    ).scalars().all()

    enviados = 0
    pendientes: list[dict[str, Any]] = []
    consulta_svc = ConsultaService(db)

    for alerta in alertas:
        veh = await db.get(Vehiculo, alerta.id_vehiculo)
        if not veh:
            continue
        # Revisar municipios 1..3 (Bogotá, Medellín, Cali seeds)
        for mun_id in (1, 2, 3):
            try:
                resp = await consulta_svc.verificar_restriccion(
                    ConsultaRequest(
                        placa=veh.placa,
                        municipio_id=mun_id,
                        fecha_hora=manana_mediodia,
                    ),
                    usuario=None,
                )
            except Exception:
                continue
            if not resp.tiene_restriccion:
                continue
            msg = {
                "title": "Mañana tienes Pico y Placa",
                "body": f"Placa {veh.placa}: {resp.mensaje}. Abre Navegación para una ruta alternativa.",
                "url": "/navegacion",
                "usuario_id": alerta.id_usuario,
                "placa": veh.placa,
                "municipio": resp.municipio,
            }
            pendientes.append(msg)
            n = await _enviar_push_usuario(db, alerta.id_usuario, msg)
            enviados += n
            break

    return {"revisadas": len(alertas), "avisos": len(pendientes), "enviados": enviados, "detalle": pendientes}


async def _enviar_push_usuario(db: AsyncSession, usuario_id: int, payload: dict) -> int:
    public_key = os.getenv("VAPID_PUBLIC_KEY", "")
    private_key = os.getenv("VAPID_PRIVATE_KEY", "")
    subject = os.getenv("VAPID_SUBJECT", "mailto:admin@porahino.co")
    if not public_key or not private_key:
        return 0

    try:
        from pywebpush import webpush
    except ImportError:
        return 0

    subs = (
        await db.execute(
            select(PushSubscription).where(PushSubscription.usuario_id == usuario_id)
        )
    ).scalars().all()
    ok = 0
    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=json.dumps(payload),
                vapid_private_key=private_key,
                vapid_claims={"sub": subject},
            )
            ok += 1
        except Exception:
            continue
    return ok

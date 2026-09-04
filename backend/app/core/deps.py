"""
Dependencias de FastAPI (inyección).

- get_current_user: conductor o admin autenticado (JWT).
- require_admin: solo rol ADMIN (US-004).
- get_current_user_optional: consulta anónima permitida (US-002).
"""

from typing import Optional

from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token
from app.models.usuario import RolUsuario, Usuario


def _token_desde_header(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    scheme, _, value = authorization.partition(" ")
    if scheme.lower() != "bearer" or not value:
        return None
    return value


async def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    token = _token_desde_header(authorization)
    if not token:
        raise UnauthorizedError("Token JWT requerido")

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise UnauthorizedError("Token inválido o expirado")

    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError) as exc:
        raise UnauthorizedError("Token inválido") from exc

    result = await db.execute(select(Usuario).where(Usuario.id == user_id))
    usuario = result.scalar_one_or_none()
    if usuario is None or not usuario.is_active:
        raise UnauthorizedError("Usuario inactivo o inexistente")
    return usuario


async def get_current_user_optional(
    authorization: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> Optional[Usuario]:
    token = _token_desde_header(authorization)
    if not token:
        return None
    try:
        return await get_current_user(authorization=authorization, db=db)
    except UnauthorizedError:
        return None


async def require_admin(usuario: Usuario = Depends(get_current_user)) -> Usuario:
    if usuario.rol != RolUsuario.ADMIN:
        raise ForbiddenError("Se requiere rol de administrador")
    return usuario

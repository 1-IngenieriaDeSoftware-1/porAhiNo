"""
Servicio: Autenticación (infraestructura de R1).

Registro y login con Bcrypt + JWT. La consulta pública (US-002) no requiere
sesión; vehículos (US-001/006) y admin (US-004) sí.
"""

from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.usuario import Usuario
from app.schemas.usuario import LoginRequest, UsuarioCreate


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, payload: UsuarioCreate) -> Usuario:
        existente = await self.db.execute(select(Usuario).where(Usuario.email == payload.email))
        if existente.scalar_one_or_none() is not None:
            raise ConflictError("Ya existe una cuenta con ese correo")

        usuario = Usuario(
            email=payload.email,
            password_hash=get_password_hash(payload.password),
            rol=payload.rol,
        )
        self.db.add(usuario)
        await self.db.flush()
        await self.db.refresh(usuario)
        return usuario

    async def login(self, payload: LoginRequest) -> dict:
        result = await self.db.execute(select(Usuario).where(Usuario.email == payload.email))
        usuario = result.scalar_one_or_none()
        if usuario is None or not usuario.is_active:
            raise UnauthorizedError("Correo o contraseña incorrectos")
        if not verify_password(payload.password, usuario.password_hash):
            raise UnauthorizedError("Correo o contraseña incorrectos")

        expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        token = create_access_token(
            data={"sub": str(usuario.id), "rol": usuario.rol.value},
            expires_delta=expires,
        )
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": int(expires.total_seconds()),
        }

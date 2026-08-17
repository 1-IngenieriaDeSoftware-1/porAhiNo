"""
Router: Autenticación

Endpoints:
  POST /api/v1/auth/register — Registro de conductor
  POST /api/v1/auth/login    — Login, retorna JWT
  GET  /api/v1/auth/me       — Perfil del usuario autenticado
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, LoginRequest, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UsuarioCreate, db: AsyncSession = Depends(get_db)):
    """
    Registro de nuevo usuario conductor.
    TODO: Implementar lógica en AuthService.register()
    """
    # service = AuthService(db)
    # return await service.register(payload)
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Autenticación con email/password. Retorna JWT.
    TODO: Implementar lógica en AuthService.login()
    """
    # service = AuthService(db)
    # return await service.login(payload)
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.get("/me", response_model=UsuarioResponse)
async def get_me(db: AsyncSession = Depends(get_db)):
    """
    Retorna el perfil del usuario actualmente autenticado.
    TODO: Agregar dependencia JWT, implementar en AuthService.get_current_user()
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")

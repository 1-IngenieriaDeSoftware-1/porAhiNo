"""
Router: Autenticación

POST /api/v1/auth/register — Registro de conductor
POST /api/v1/auth/login    — Login, retorna JWT
GET  /api/v1/auth/me       — Perfil del usuario autenticado
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.usuario import Usuario
from app.schemas.usuario import LoginRequest, TokenResponse, UsuarioCreate, UsuarioResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UsuarioCreate, db: AsyncSession = Depends(get_db)):
    return await AuthService(db).register(payload)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await AuthService(db).login(payload)


@router.get("/me", response_model=UsuarioResponse)
async def get_me(usuario: Usuario = Depends(get_current_user)):
    return usuario

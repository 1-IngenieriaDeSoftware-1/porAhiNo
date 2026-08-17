"""
Schemas Pydantic: Usuario

Separan la representación de datos de la capa de modelos.
NUNCA exponen el password_hash en respuestas.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator

from app.models.usuario import RolUsuario


# --- Input schemas (request body) ---

class UsuarioCreate(BaseModel):
    """Schema para registro de nuevo usuario."""
    email: EmailStr
    password: str  # Se hashea en el service, nunca se guarda en texto plano
    rol: RolUsuario = RolUsuario.CONDUCTOR

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        return v


class UsuarioUpdate(BaseModel):
    """Schema para actualización parcial de usuario."""
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


# --- Output schemas (response body) ---

class UsuarioResponse(BaseModel):
    """Schema de respuesta — NUNCA incluye password_hash."""
    id: int
    email: EmailStr
    rol: RolUsuario
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Auth schemas ---

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos

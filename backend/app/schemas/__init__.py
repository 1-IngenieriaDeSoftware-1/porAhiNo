"""Schemas Pydantic — contratos de entrada/salida de la API."""

from app.schemas.alerta import AlertaCreate, AlertaResponse, AlertaUpdate
from app.schemas.consulta import ConsultaRequest, ConsultaResponse
from app.schemas.decreto import DecretoCreate, DecretoResponse, DecretoUpdate
from app.schemas.municipio import MunicipioCreate, MunicipioResponse
from app.schemas.usuario import LoginRequest, TokenResponse, UsuarioCreate, UsuarioResponse
from app.schemas.vehiculo import VehiculoCreate, VehiculoResponse, VehiculoUpdate

__all__ = [
    "AlertaCreate",
    "AlertaResponse",
    "AlertaUpdate",
    "ConsultaRequest",
    "ConsultaResponse",
    "DecretoCreate",
    "DecretoResponse",
    "DecretoUpdate",
    "MunicipioCreate",
    "MunicipioResponse",
    "LoginRequest",
    "TokenResponse",
    "UsuarioCreate",
    "UsuarioResponse",
    "VehiculoCreate",
    "VehiculoResponse",
    "VehiculoUpdate",
]

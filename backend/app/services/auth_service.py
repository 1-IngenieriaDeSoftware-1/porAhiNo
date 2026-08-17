"""
Servicio: Autenticación y gestión de usuarios.

Responsabilidades:
- Registro de usuarios (hash de contraseña con Bcrypt)
- Autenticación (email/password → JWT)
- Recuperación de usuario actual por token JWT

NOTA: La contraseña NUNCA se guarda en texto plano (Ley 1581 de 2012).
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, LoginRequest


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, payload: UsuarioCreate) -> Usuario:
        """
        Registra un nuevo usuario.
        TODO:
          1. Verificar que el email no existe
          2. Hashear la contraseña con Bcrypt
          3. Crear y guardar el usuario en la BD
          4. Retornar el usuario creado
        """
        raise NotImplementedError

    async def login(self, payload: LoginRequest) -> dict:
        """
        Autentica un usuario y retorna un JWT.
        TODO:
          1. Buscar usuario por email
          2. Verificar contraseña con verify_password()
          3. Generar JWT con create_access_token()
          4. Retornar token y metadatos
        """
        raise NotImplementedError

    async def get_current_user(self, token: str) -> Usuario:
        """
        Decodifica el JWT y retorna el usuario autenticado.
        TODO:
          1. Decodificar token con decode_access_token()
          2. Buscar usuario por ID en el payload
          3. Verificar que el usuario esté activo
        """
        raise NotImplementedError

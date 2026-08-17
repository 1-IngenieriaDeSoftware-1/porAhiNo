"""
Configuración central de la aplicación via Pydantic Settings.
Lee variables del archivo .env automáticamente.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # --- Base de datos ---
    DATABASE_URL: str
    DATABASE_URL_SYNC: str

    # --- JWT ---
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- CORS ---
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # --- Entorno ---
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

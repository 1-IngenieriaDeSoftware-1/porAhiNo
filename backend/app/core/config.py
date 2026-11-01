"""
Configuración central vía Pydantic Settings.
Lee variables del archivo .env automáticamente.
"""

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Base de datos ---
    DATABASE_URL: str
    DATABASE_URL_SYNC: str

    # --- JWT ---
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- CORS ---
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://localhost",  # Capacitor Android (androidScheme)
        "capacitor://localhost",
        "http://localhost",
    ]

    # --- Entorno ---
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # --- Ruteo Valhalla (MainV2) ---
    VALHALLA_BASE_URL: str = "http://127.0.0.1:8002"
    VALHALLA_TIMEOUT_S: float = 12.0
    # Cruce zona: 0.0 = cualquier intersección invalida la alternativa
    ROUTING_CRUCE_FRAC_MAX: float = 0.0
    # Desvío máximo vs duración directa
    ROUTING_MAX_DETOR_FACTOR: float = 1.8
    # GPS cliente (documentado; el FE también tiene defaults)
    GPS_MAX_ACCURACY_M: float = 40.0
    GPS_OFF_ROUTE_M: float = 40.0

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, value: object) -> list[str]:
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.startswith("["):
                import json

                parsed = json.loads(stripped)
                return [str(item).strip() for item in parsed]
            return [item.strip() for item in stripped.split(",") if item.strip()]
        if isinstance(value, list):
            return [str(item).strip() for item in value]
        return ["http://localhost:3000"]


settings = Settings()

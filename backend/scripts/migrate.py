"""
Aplica migraciones Alembic contra el Postgres local (Docker).

Uso (desde /backend, con el contenedor arriba):
  python -m scripts.migrate
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

from alembic import command
from alembic.config import Config
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")


def _url() -> str:
    import os

    url = os.getenv("DATABASE_URL_SYNC")
    if not url:
        print("Falta DATABASE_URL_SYNC. Copia .env.example a .env", file=sys.stderr)
        sys.exit(1)
    return url


def esperar_postgres(url: str, intentos: int = 30) -> None:
    engine = create_engine(url)
    for i in range(intentos):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return
        except Exception:
            if i == 0:
                print("Esperando a PostgreSQL en Docker...")
            time.sleep(1)
    print("No se pudo conectar. ¿Corriste `docker compose up -d` en la raíz?", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    url = _url()
    esperar_postgres(url)
    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    command.upgrade(cfg, "head")
    print("Migraciones aplicadas (alembic upgrade head).")


if __name__ == "__main__":
    main()

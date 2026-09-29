"""
US-DB-08: verifica que PostgreSQL local (Docker) responde y tiene el esquema.

Uso (desde /backend, con `docker compose up -d` en la raíz):
  python -m scripts.check_db
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")

ESPERADAS = {"usuarios", "municipios", "decretos", "vehiculos", "consultas", "alertas"}


def main() -> None:
    url = os.getenv("DATABASE_URL_SYNC")
    if not url:
        print("Falta DATABASE_URL_SYNC. Copia .env.example a .env", file=sys.stderr)
        sys.exit(1)

    engine = create_engine(url)
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        print(
            "No se pudo conectar a Postgres.\n"
            "1) Abre Docker Desktop\n"
            "2) En la raíz del repo: docker compose up -d\n"
            f"Detalle: {exc}",
            file=sys.stderr,
        )
        sys.exit(1)

    tablas = set(inspect(engine).get_table_names())
    faltan = ESPERADAS - tablas
    if faltan:
        print(
            f"Conectó a la BD, pero faltan tablas: {sorted(faltan)}\n"
            "Corre: python -m scripts.migrate",
            file=sys.stderr,
        )
        sys.exit(1)

    print("OK: Postgres Docker en 127.0.0.1:5432")
    print(f"OK: esquema presente ({', '.join(sorted(ESPERADAS))})")
    print("Listo para seeds y uvicorn.")


if __name__ == "__main__":
    main()

"""Alembic env.py — migraciones síncronas contra PostgreSQL local (Docker).

No importa Settings completo: solo DATABASE_URL_SYNC (o el valor de alembic.ini).
"""

from __future__ import annotations

import os
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import create_engine, pool

from alembic import context
from dotenv import load_dotenv

from app.core.base import Base
import app.models  # noqa: F401

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

sync_url = os.getenv("DATABASE_URL_SYNC") or config.get_main_option("sqlalchemy.url")
if not sync_url:
    raise RuntimeError(
        "Falta DATABASE_URL_SYNC. Copia backend/.env.example a backend/.env "
        "y levanta Postgres con: docker compose up -d"
    )
config.set_main_option("sqlalchemy.url", sync_url.replace("%", "%%"))
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(sync_url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

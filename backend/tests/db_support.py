"""Utilidades para tests que sí hablan con Postgres (CI / ENVIRONMENT=testing)."""

from __future__ import annotations

import os
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

BACKEND = Path(__file__).resolve().parents[1]

requires_postgres = pytest.mark.skipif(
    os.getenv("ENVIRONMENT") != "testing" or not os.getenv("DATABASE_URL_SYNC"),
    reason="Solo corre con Postgres de CI (ENVIRONMENT=testing)",
)


def alembic_cfg() -> Config:
    cfg = Config(str(BACKEND / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND / "alembic"))
    cfg.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL_SYNC"].replace("%", "%%"))
    return cfg


def ensure_schema() -> None:
    command.upgrade(alembic_cfg(), "head")


def session_factory():
    engine = create_async_engine(os.environ["DATABASE_URL"])
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return engine, factory

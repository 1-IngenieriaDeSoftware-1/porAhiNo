"""Roundtrip Alembic contra Postgres (CI o ENVIRONMENT=testing)."""

from __future__ import annotations

import os
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect

ESPERADAS = {"usuarios", "municipios", "decretos", "vehiculos", "consultas", "alertas"}

pytestmark = pytest.mark.skipif(
    os.getenv("ENVIRONMENT") != "testing" or not os.getenv("DATABASE_URL_SYNC"),
    reason="Solo corre con Postgres de CI (ENVIRONMENT=testing)",
)


def _alembic_cfg() -> Config:
    backend = Path(__file__).resolve().parents[1]
    cfg = Config(str(backend / "alembic.ini"))
    cfg.set_main_option("script_location", str(backend / "alembic"))
    cfg.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL_SYNC"].replace("%", "%%"))
    return cfg


def test_upgrade_downgrade_no_deja_tablas_huerfanas() -> None:
    url = os.environ["DATABASE_URL_SYNC"]
    cfg = _alembic_cfg()
    command.upgrade(cfg, "head")
    engine = create_engine(url)
    with engine.connect() as _:
        tablas = set(inspect(engine).get_table_names())
    assert ESPERADAS <= tablas

    command.downgrade(cfg, "base")
    tablas = set(inspect(engine).get_table_names())
    huerfanas = ESPERADAS & tablas
    assert not huerfanas, f"Quedaron tablas: {huerfanas}"

    command.upgrade(cfg, "head")
    tablas = set(inspect(engine).get_table_names())
    assert ESPERADAS <= tablas

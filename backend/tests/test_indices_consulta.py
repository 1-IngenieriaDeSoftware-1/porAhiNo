"""US-DB-06: índice municipio+vigencia para consulta < 1 s. Sin Postgres."""

from __future__ import annotations

from datetime import date
from pathlib import Path

from sqlalchemy.dialects import postgresql

from app.models.decreto import Decreto
from app.services.consulta_service import decretos_vigentes_stmt

BACKEND = Path(__file__).resolve().parents[1]
MIGRATION_001 = BACKEND / "alembic" / "versions" / "001_initial_schema.py"
MIGRATION_003 = BACKEND / "alembic" / "versions" / "003_indices_consulta_decretos.py"


def _indices() -> dict:
    return {indice.name: indice for indice in Decreto.__table__.indexes}


def test_indice_compuesto_municipio_vigencia() -> None:
    indice = _indices()["ix_decretos_municipio_vigencia"]
    assert list(indice.columns.keys()) == ["municipio_id", "vigencia_desde", "vigencia_hasta"]


def test_indice_parcial_de_consulta_vigente() -> None:
    indice = _indices()["ix_decretos_consulta_vigente"]
    assert list(indice.columns.keys()) == ["municipio_id", "vigencia_desde", "vigencia_hasta"]
    dialect_opts = indice.dialect_options.get("postgresql", {})
    assert dialect_opts.get("where") is not None


def test_migracion_001_crea_el_indice_compuesto() -> None:
    source = MIGRATION_001.read_text(encoding="utf-8")
    assert "ix_decretos_municipio_vigencia" in source
    assert "municipio_id" in source
    assert "vigencia_desde" in source
    assert "vigencia_hasta" in source


def test_migracion_003_crea_el_indice_parcial() -> None:
    source = MIGRATION_003.read_text(encoding="utf-8")
    assert "ix_decretos_consulta_vigente" in source
    assert "is_active = true" in source
    assert "drop_index" in source


def test_query_de_vigentes_filtra_municipio_y_fechas() -> None:
    sql = str(
        decretos_vigentes_stmt(1, date(2026, 9, 16)).compile(dialect=postgresql.dialect())
    ).lower()
    assert "decretos" in sql
    assert "municipio_id" in sql
    assert "vigencia_desde" in sql
    assert "vigencia_hasta" in sql
    assert "is_active" in sql

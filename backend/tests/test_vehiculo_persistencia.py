"""US-DB-04: persistencia de vehículos (constraint y capa de servicio). Sin Postgres."""

from __future__ import annotations

import inspect
from pathlib import Path

from sqlalchemy import UniqueConstraint

from app.models.vehiculo import Vehiculo
from app.services.vehiculo_service import VehiculoService

BACKEND = Path(__file__).resolve().parents[1]
MIGRATION_001 = BACKEND / "alembic" / "versions" / "001_initial_schema.py"
MIGRATION_002 = BACKEND / "alembic" / "versions" / "002_unique_placa_por_usuario.py"


def test_unique_placa_por_usuario_en_el_modelo() -> None:
    uniques = [
        constraint
        for constraint in Vehiculo.__table__.constraints
        if isinstance(constraint, UniqueConstraint)
    ]
    assert any(constraint.name == "uq_vehiculos_usuario_placa" for constraint in uniques)
    columnas = next(
        {col.name for col in constraint.columns}
        for constraint in uniques
        if constraint.name == "uq_vehiculos_usuario_placa"
    )
    assert columnas == {"id_usuario", "placa"}


def test_fk_usuario_es_cascade() -> None:
    fks = list(Vehiculo.__table__.foreign_keys)
    assert any(
        fk.column.table.name == "usuarios" and fk.ondelete == "CASCADE" for fk in fks
    )


def test_migracion_001_declara_cascade_en_vehiculos() -> None:
    source = MIGRATION_001.read_text(encoding="utf-8")
    assert 'name="fk_vehiculos_id_usuario"' in source
    assert 'ondelete="CASCADE"' in source


def test_migracion_002_crea_unique_placa_usuario() -> None:
    source = MIGRATION_002.read_text(encoding="utf-8")
    assert "uq_vehiculos_usuario_placa" in source
    assert "id_usuario" in source
    assert "placa" in source
    assert "drop_constraint" in source


def test_create_y_listado_estan_implementados() -> None:
    assert inspect.iscoroutinefunction(VehiculoService.create)
    assert inspect.iscoroutinefunction(VehiculoService.get_by_usuario)
    assert "NotImplementedError" not in inspect.getsource(VehiculoService.create)
    assert "NotImplementedError" not in inspect.getsource(VehiculoService.get_by_usuario)

"""US-DB-07: modelo de suscripción de alerta. Sin Postgres."""

from __future__ import annotations

import inspect
from pathlib import Path

import pytest
from sqlalchemy import CheckConstraint, UniqueConstraint

from app.models.alerta import Alerta
from app.services.alertas_service import AlertasService

BACKEND = Path(__file__).resolve().parents[1]
MIGRATION_001 = BACKEND / "alembic" / "versions" / "001_initial_schema.py"
MIGRATION_004 = BACKEND / "alembic" / "versions" / "004_alertas_suscripcion.py"


def test_tabla_alertas_tiene_campos_de_suscripcion() -> None:
    columnas = Alerta.__table__.c
    assert columnas.id_usuario.nullable is False
    assert columnas.id_vehiculo.nullable is False
    assert columnas.minutos_antes.nullable is False
    assert columnas.is_active.nullable is False


def test_fks_de_alerta_son_cascade() -> None:
    por_tabla = {fk.column.table.name: fk.ondelete for fk in Alerta.__table__.foreign_keys}
    assert por_tabla["usuarios"] == "CASCADE"
    assert por_tabla["vehiculos"] == "CASCADE"


def test_unique_usuario_vehiculo() -> None:
    uniques = [
        c for c in Alerta.__table__.constraints if isinstance(c, UniqueConstraint)
    ]
    constraint = next(c for c in uniques if c.name == "uq_alertas_usuario_vehiculo")
    assert {col.name for col in constraint.columns} == {"id_usuario", "id_vehiculo"}


def test_check_minutos_antes_positivo() -> None:
    checks = [c for c in Alerta.__table__.constraints if isinstance(c, CheckConstraint)]
    assert any(c.name == "ck_alertas_minutos_antes" for c in checks)


def test_migracion_001_crea_alertas() -> None:
    source = MIGRATION_001.read_text(encoding="utf-8")
    assert '"alertas"' in source
    assert "minutos_antes" in source
    assert "is_active" in source
    assert 'name="fk_alertas_id_usuario"' in source
    assert 'name="fk_alertas_id_vehiculo"' in source


def test_migracion_004_unique_y_check() -> None:
    source = MIGRATION_004.read_text(encoding="utf-8")
    assert "uq_alertas_usuario_vehiculo" in source
    assert "ck_alertas_minutos_antes" in source


def test_persistencia_esta_implementada() -> None:
    assert inspect.iscoroutinefunction(AlertasService.suscribir)
    assert inspect.iscoroutinefunction(AlertasService.listar_por_usuario)
    assert inspect.iscoroutinefunction(AlertasService.desactivar)
    assert "NotImplementedError" not in inspect.getsource(AlertasService.suscribir)


def test_desactivar_es_soft_delete() -> None:
    alerta = Alerta(id_usuario=1, id_vehiculo=1, minutos_antes=60, is_active=True)
    alerta.desactivar()
    assert alerta.is_active is False


def test_minutos_antes_debe_ser_positivo() -> None:
    from pydantic import ValidationError

    from app.schemas.alerta import AlertaCreate

    with pytest.raises(ValidationError):
        AlertaCreate(id_vehiculo=1, minutos_antes=0)
    with pytest.raises(ValidationError):
        AlertaCreate(id_vehiculo=1, minutos_antes=-10)

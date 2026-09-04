"""US-DB-01: el esquema Alembic coincide con los modelos y es reversible."""

from __future__ import annotations

import ast
from pathlib import Path

MIGRATION = Path(__file__).resolve().parents[1] / "alembic" / "versions" / "001_initial_schema.py"
ESPERADAS = {"usuarios", "municipios", "decretos", "vehiculos", "consultas", "alertas"}


def _llamadas(source: str, metodo: str) -> list[str]:
    tree = ast.parse(source)
    names: list[str] = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        func = node.func
        if isinstance(func, ast.Attribute) and func.attr == metodo:
            if node.args and isinstance(node.args[0], ast.Constant) and isinstance(node.args[0].value, str):
                names.append(node.args[0].value)
    return names


def test_migracion_crea_las_seis_tablas_del_srs() -> None:
    source = MIGRATION.read_text(encoding="utf-8")
    assert set(_llamadas(source, "create_table")) == ESPERADAS


def test_downgrade_elimina_todas_las_tablas_en_orden_seguro() -> None:
    source = MIGRATION.read_text(encoding="utf-8")
    dropped = _llamadas(source, "drop_table")
    assert set(dropped) == ESPERADAS
    assert dropped.index("alertas") < dropped.index("usuarios")
    assert dropped.index("consultas") < dropped.index("municipios")
    assert dropped.index("vehiculos") < dropped.index("usuarios")
    assert dropped.index("decretos") < dropped.index("municipios")


def test_modelos_exponen_las_mismas_tablas() -> None:
    from app.core.base import Base
    import app.models  # noqa: F401

    tablas_modelo = {tabla.name for tabla in Base.metadata.sorted_tables}
    assert ESPERADAS <= tablas_modelo

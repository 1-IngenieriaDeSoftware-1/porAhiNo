"""US-DB-05: modelo de historial de consultas. Sin Postgres."""

from __future__ import annotations

import inspect

from app.models.consulta import Consulta
from app.services.consulta_service import ConsultaService


def test_fks_de_usuario_y_vehiculo_son_nulas() -> None:
    assert Consulta.__table__.c.id_usuario.nullable is True
    assert Consulta.__table__.c.id_vehiculo.nullable is True
    assert Consulta.__table__.c.municipio_id.nullable is False
    assert Consulta.__table__.c.placa_consultada.nullable is False
    assert Consulta.__table__.c.resultado_restringido.nullable is False
    assert Consulta.__table__.c.fecha_verificada.nullable is False


def test_fk_usuario_y_vehiculo_quedan_en_set_null() -> None:
    por_tabla = {fk.column.table.name: fk.ondelete for fk in Consulta.__table__.foreign_keys}
    assert por_tabla["usuarios"] == "SET NULL"
    assert por_tabla["vehiculos"] == "SET NULL"
    assert por_tabla["municipios"] == "RESTRICT"


def test_registrar_historial_esta_implementado() -> None:
    assert inspect.iscoroutinefunction(ConsultaService.registrar_historial)
    assert "NotImplementedError" not in inspect.getsource(ConsultaService.registrar_historial)

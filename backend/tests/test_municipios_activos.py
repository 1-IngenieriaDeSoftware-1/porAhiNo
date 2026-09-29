"""US-003.2: listado de municipios con decreto activo. Sin Postgres."""

from __future__ import annotations

import inspect

from app.services.consulta_service import ConsultaService


def test_get_municipios_activos_esta_implementado() -> None:
    assert inspect.iscoroutinefunction(ConsultaService.get_municipios_activos)
    source = inspect.getsource(ConsultaService.get_municipios_activos)
    assert "NotImplementedError" not in source
    assert "is_active" in source

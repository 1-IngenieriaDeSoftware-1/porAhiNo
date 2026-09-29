"""US-DB-03: decretos de ejemplo con horas, dígitos y vigencia. Sin Postgres."""

from datetime import time

from app.data.decretos_r1 import DECRETOS_R1
from app.data.municipios_r1 import CODIGOS_DANE_R1
from app.models.decreto import Decreto
from app.schemas.decreto import DecretoCreate, DecretoUpdate


def test_hay_al_menos_un_decreto_por_municipio_r1() -> None:
    cubiertos = {item["codigo_dane"] for item in DECRETOS_R1}
    assert cubiertos == CODIGOS_DANE_R1


def test_campos_de_restriccion_completos() -> None:
    for item in DECRETOS_R1:
        assert item["hora_inicio"] < item["hora_fin"]
        assert item["dias_restriccion"]
        assert item["digitos_restringidos"]
        assert item["vigencia_desde"]
        dias = [int(part) for part in item["dias_restriccion"].split(",")]
        assert dias == sorted(dias)
        assert set(dias) <= set(range(7))
        digitos = item["digitos_restringidos"].split(",")
        assert set(digitos) <= set("0123456789")


def test_cada_ciudad_tiene_rotacion_lun_a_vie() -> None:
    """Un decreto por día hábil: refleja rotación real (Medellín/Cali) y approx. Bogotá."""
    for dane in CODIGOS_DANE_R1:
        items = [item for item in DECRETOS_R1 if item["codigo_dane"] == dane]
        dias = {item["dias_restriccion"] for item in items}
        assert dias == {"0", "1", "2", "3", "4"}
        digitos = {item["digitos_restringidos"] for item in items}
        assert len(digitos) == 5


def test_horarios_por_ciudad() -> None:
    bog = [item for item in DECRETOS_R1 if item["codigo_dane"] == "11001"]
    med = [item for item in DECRETOS_R1 if item["codigo_dane"] == "05001"]
    cal = [item for item in DECRETOS_R1 if item["codigo_dane"] == "76001"]
    assert all(item["hora_inicio"] == time(6, 0) and item["hora_fin"] == time(21, 0) for item in bog)
    assert all(item["hora_inicio"] == time(5, 0) and item["hora_fin"] == time(20, 0) for item in med)
    assert all(item["hora_inicio"] == time(6, 0) and item["hora_fin"] == time(19, 0) for item in cal)


def test_medellin_usa_rotacion_2h_2026() -> None:
    med = {
        item["dias_restriccion"]: item["digitos_restringidos"]
        for item in DECRETOS_R1
        if item["codigo_dane"] == "05001"
    }
    assert med == {"0": "5,8", "1": "1,4", "2": "0,2", "3": "3,6", "4": "7,9"}


def test_desactivar_es_soft_delete() -> None:
    decreto = Decreto(
        municipio_id=1,
        hora_inicio=time(6, 0),
        hora_fin=time(21, 0),
        dias_restriccion="0,1,2,3,4",
        digitos_restringidos="1,2",
        is_active=True,
    )
    decreto.desactivar()
    assert decreto.is_active is False
    assert Decreto.is_active.nullable is False


def test_listas_de_dias_y_digitos() -> None:
    decreto = Decreto(dias_restriccion="0,1,2,3,4", digitos_restringidos="1,2")
    assert decreto.lista_dias() == [0, 1, 2, 3, 4]
    assert decreto.lista_digitos() == ["1", "2"]


def test_schema_create_y_update_exponen_vigencia_y_is_active() -> None:
    campos_create = set(DecretoCreate.model_fields)
    assert {
        "hora_inicio",
        "hora_fin",
        "dias_restriccion",
        "digitos_restringidos",
        "vigencia_desde",
        "municipio_id",
    } <= campos_create
    assert "is_active" in DecretoUpdate.model_fields
    assert "is_active" not in campos_create

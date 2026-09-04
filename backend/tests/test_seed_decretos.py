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


def test_franjas_medellin_y_cali_son_distintas() -> None:
    med = [item for item in DECRETOS_R1 if item["codigo_dane"] == "05001"]
    cal = [item for item in DECRETOS_R1 if item["codigo_dane"] == "76001"]
    assert {item["hora_inicio"] for item in med} == {time(5, 0), time(17, 0)}
    assert {item["hora_inicio"] for item in cal} == {time(6, 0), time(17, 30)}


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

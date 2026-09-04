"""US-DB-02: catálogo R1 listo para GET /api/v1/consulta/municipios. Sin Postgres."""

from app.data.municipios_r1 import CODIGOS_DANE_R1, MUNICIPIOS_R1
from app.schemas.municipio import MunicipioResponse


def test_catalogo_tiene_los_tres_municipios_del_alcance() -> None:
    nombres = {item["nombre"] for item in MUNICIPIOS_R1}
    assert nombres == {"Bogotá", "Medellín", "Cali"}
    assert len(MUNICIPIOS_R1) == 3


def test_cada_municipio_tiene_codigo_dane_unico() -> None:
    codigos = [item["codigo_dane"] for item in MUNICIPIOS_R1]
    assert len(codigos) == len(set(codigos))
    assert CODIGOS_DANE_R1 == set(codigos)
    assert "05001" in CODIGOS_DANE_R1  # cero a la izquierda (Medellín)


def test_dane_oficial_divipola() -> None:
    por_nombre = {item["nombre"]: item for item in MUNICIPIOS_R1}
    assert por_nombre["Bogotá"]["codigo_dane"] == "11001"
    assert por_nombre["Bogotá"]["departamento"] == "Cundinamarca"
    assert por_nombre["Medellín"]["codigo_dane"] == "05001"
    assert por_nombre["Medellín"]["departamento"] == "Antioquia"
    assert por_nombre["Cali"]["codigo_dane"] == "76001"
    assert por_nombre["Cali"]["departamento"] == "Valle del Cauca"


def test_schema_de_respuesta_cubre_el_catalogo() -> None:
    """El GET de municipios (US-003) usa MunicipioResponse: el seed debe caber ahí."""
    for item in MUNICIPIOS_R1:
        MunicipioResponse(id=1, **item)

"""Tests puros de placa colombiana (AC-001, AC-002). No requieren base de datos."""

import pytest

from app.core.placa import es_placa_valida, ultimo_digito, validar_placa


@pytest.mark.parametrize(
    "placa",
    ["ABC123", "abc123", "ABC-123", "xyz987", "ABC12D"],
)
def test_placa_valida(placa: str) -> None:
    assert es_placa_valida(placa)
    assert len(validar_placa(placa)) == 6


@pytest.mark.parametrize("placa", ["12345", "AB123", "ABCD12", "", "12ABC3", "ABC1234"])
def test_placa_invalida(placa: str) -> None:
    assert not es_placa_valida(placa)
    with pytest.raises(ValueError):
        validar_placa(placa)


def test_ultimo_digito_particular() -> None:
    assert ultimo_digito("ABC123") == "3"


def test_ultimo_digito_moto() -> None:
    assert ultimo_digito("ABC12D") == "2"

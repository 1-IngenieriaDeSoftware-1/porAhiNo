"""
Validación de placa colombiana (AC-001, AC-002).

Módulo puro, sin dependencias de FastAPI ni de settings, para poder
unit-testearlo en CI sin base de datos.

Formatos aceptados (6 caracteres):
  - Particular / carga / público: 3 letras + 3 dígitos (ABC123)
  - Moto: 3 letras + 2 dígitos + 1 letra (ABC12D)
"""

from __future__ import annotations

import re

PLACA_REGEX = re.compile(r"^[A-Z]{3}[0-9]{2}[A-Z0-9]$")
PLACA_MENSAJE_ERROR = "Formato de placa inválido. Use formato colombiano: ABC123 o ABC12D"


def normalizar_placa(placa: str) -> str:
    """Mayúsculas y sin espacios ni guiones."""
    return placa.upper().replace(" ", "").replace("-", "").strip()


def es_placa_valida(placa: str) -> bool:
    return bool(PLACA_REGEX.match(normalizar_placa(placa)))


def validar_placa(placa: str) -> str:
    """Normaliza y valida. Lanza ValueError si el formato no es colombiano."""
    normalizada = normalizar_placa(placa)
    if not PLACA_REGEX.match(normalizada):
        raise ValueError(PLACA_MENSAJE_ERROR)
    return normalizada


def ultimo_digito(placa: str) -> str:
    """
    Último dígito numérico de la placa, usado para Pico y Placa.
    En motos (ABC12D) el dígito relevante es el último número (2), no la letra.
    """
    normalizada = normalizar_placa(placa)
    for char in reversed(normalizada):
        if char.isdigit():
            return char
    raise ValueError("La placa no contiene dígitos")

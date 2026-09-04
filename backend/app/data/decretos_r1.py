"""Decretos de ejemplo Release 1 (US-DB-03).

Son reglas académicas de Pico y Placa, no el texto oficial de cada alcaldía.
Al menos un decreto por municipio del catálogo R1.
Días: 0=Lunes ... 6=Domingo.
"""

from __future__ import annotations

from datetime import date, time
from typing import TypedDict


class DecretoSeed(TypedDict):
    codigo_dane: str
    numero_decreto: str
    descripcion: str
    hora_inicio: time
    hora_fin: time
    dias_restriccion: str
    digitos_restringidos: str
    vigencia_desde: date
    vigencia_hasta: date | None


_VIGENCIA_DESDE = date(2026, 1, 1)
_VIGENCIA_HASTA = date(2026, 12, 31)
_LUN_VIE = "0,1,2,3,4"

DECRETOS_R1: tuple[DecretoSeed, ...] = (
    {
        "codigo_dane": "11001",
        "numero_decreto": "SEED-BOG-R1",
        "descripcion": "Bogotá particular, jornada continua (ejemplo académico).",
        "hora_inicio": time(6, 0),
        "hora_fin": time(21, 0),
        "dias_restriccion": _LUN_VIE,
        "digitos_restringidos": "1,2",
        "vigencia_desde": _VIGENCIA_DESDE,
        "vigencia_hasta": _VIGENCIA_HASTA,
    },
    {
        "codigo_dane": "05001",
        "numero_decreto": "SEED-MED-R1-AM",
        "descripcion": "Medellín particular, franja mañana (ejemplo académico).",
        "hora_inicio": time(5, 0),
        "hora_fin": time(8, 0),
        "dias_restriccion": _LUN_VIE,
        "digitos_restringidos": "3,4",
        "vigencia_desde": _VIGENCIA_DESDE,
        "vigencia_hasta": _VIGENCIA_HASTA,
    },
    {
        "codigo_dane": "05001",
        "numero_decreto": "SEED-MED-R1-PM",
        "descripcion": "Medellín particular, franja tarde (ejemplo académico).",
        "hora_inicio": time(17, 0),
        "hora_fin": time(20, 0),
        "dias_restriccion": _LUN_VIE,
        "digitos_restringidos": "3,4",
        "vigencia_desde": _VIGENCIA_DESDE,
        "vigencia_hasta": _VIGENCIA_HASTA,
    },
    {
        "codigo_dane": "76001",
        "numero_decreto": "SEED-CAL-R1-AM",
        "descripcion": "Cali particular, franja mañana (ejemplo académico).",
        "hora_inicio": time(6, 0),
        "hora_fin": time(8, 30),
        "dias_restriccion": _LUN_VIE,
        "digitos_restringidos": "5,6",
        "vigencia_desde": _VIGENCIA_DESDE,
        "vigencia_hasta": _VIGENCIA_HASTA,
    },
    {
        "codigo_dane": "76001",
        "numero_decreto": "SEED-CAL-R1-PM",
        "descripcion": "Cali particular, franja tarde (ejemplo académico).",
        "hora_inicio": time(17, 30),
        "hora_fin": time(19, 30),
        "dias_restriccion": _LUN_VIE,
        "digitos_restringidos": "5,6",
        "vigencia_desde": _VIGENCIA_DESDE,
        "vigencia_hasta": _VIGENCIA_HASTA,
    },
)

"""Decretos de prueba Release 1 inspirados en Pico y Placa real (Colombia).

Modelo del sistema: dígitos + día de la semana (0=Lunes … 6=Domingo) + franja horaria.
No replica al 100 % cada decreto oficial (Bogotá oficial es par/impar por fecha del mes),
pero sí refleja horarios y rotaciones típicas de 2026 para ejercitar US-002.

Referencias de diseño (académicas / aproximadas):
- Bogotá: 6:00–21:00; pares de dígitos por día hábil (aproximación; oficial ≈ par/impar).
- Medellín 2H 2026: 5:00–20:00 continuo; Lun 5-8, Mar 1-4, Mie 0-2, Jue 3-6, Vie 7-9.
- Cali: 6:00–19:00 continuo; Lun 1-2 … Vie 9-0 (rotación tipo primer semestre).
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

_DIAS = ("LUN", "MAR", "MIE", "JUE", "VIE")
# weekday: 0=Lunes … 4=Viernes
_BOG_DIGITOS = ("1,2", "3,4", "5,6", "7,8", "9,0")
_MED_DIGITOS = ("5,8", "1,4", "0,2", "3,6", "7,9")  # 2H 2026
_CAL_DIGITOS = ("1,2", "3,4", "5,6", "7,8", "9,0")


def _por_dia(
    codigo_dane: str,
    prefijo: str,
    ciudad: str,
    hora_inicio: time,
    hora_fin: time,
    digitos_por_dia: tuple[str, ...],
    nota: str,
) -> tuple[DecretoSeed, ...]:
    items: list[DecretoSeed] = []
    for weekday, etiqueta, digitos in zip(range(5), _DIAS, digitos_por_dia, strict=True):
        items.append(
            {
                "codigo_dane": codigo_dane,
                "numero_decreto": f"{prefijo}-{etiqueta}",
                "descripcion": (
                    f"{ciudad} particulares: dígitos {digitos} el {etiqueta.lower()}. {nota}"
                ),
                "hora_inicio": hora_inicio,
                "hora_fin": hora_fin,
                "dias_restriccion": str(weekday),
                "digitos_restringidos": digitos,
                "vigencia_desde": _VIGENCIA_DESDE,
                "vigencia_hasta": _VIGENCIA_HASTA,
            }
        )
    return tuple(items)


DECRETOS_R1: tuple[DecretoSeed, ...] = (
    *_por_dia(
        "11001",
        "SEED-BOG",
        "Bogotá",
        time(6, 0),
        time(21, 0),
        _BOG_DIGITOS,
        "Horario continuo tipo distrital; dígitos por día (aprox. de prueba).",
    ),
    *_por_dia(
        "05001",
        "SEED-MED",
        "Medellín",
        time(5, 0),
        time(20, 0),
        _MED_DIGITOS,
        "Rotación 2H 2026 (último dígito carro).",
    ),
    *_por_dia(
        "76001",
        "SEED-CAL",
        "Cali",
        time(6, 0),
        time(19, 0),
        _CAL_DIGITOS,
        "Rotación semanal tipo primer semestre.",
    ),
)

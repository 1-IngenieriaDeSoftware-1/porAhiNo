"""Catálogo Release 1: municipios del alcance (US-DB-02 / US-003).

Códigos DANE oficiales (divipola). Medellín lleva el cero a la izquierda.
"""

from __future__ import annotations

from typing import TypedDict


class MunicipioSeed(TypedDict):
    nombre: str
    departamento: str
    codigo_dane: str


MUNICIPIOS_R1: tuple[MunicipioSeed, ...] = (
    {"nombre": "Bogotá", "departamento": "Cundinamarca", "codigo_dane": "11001"},
    {"nombre": "Medellín", "departamento": "Antioquia", "codigo_dane": "05001"},
    {"nombre": "Cali", "departamento": "Valle del Cauca", "codigo_dane": "76001"},
)

CODIGOS_DANE_R1: frozenset[str] = frozenset(item["codigo_dane"] for item in MUNICIPIOS_R1)

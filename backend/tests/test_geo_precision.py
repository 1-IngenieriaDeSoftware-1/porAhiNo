"""Tests geometría de precisión MainV2."""

from app.services.geo_precision import (
    densificar_polilinea,
    polilinea_cruza_anillo,
    buffer_ring_outward,
    segmentos_intersectan,
)


def test_segmentos_cruzan():
    assert segmentos_intersectan([0, 0], [2, 2], [0, 2], [2, 0]) is True
    assert segmentos_intersectan([0, 0], [1, 0], [0, 1], [1, 1]) is False


def test_polilinea_cruza_cuadrado():
    ring = [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]
    # atraviesa el cuadrado
    assert polilinea_cruza_anillo([[-1, 1], [3, 1]], ring) is True
    # completamente fuera
    assert polilinea_cruza_anillo([[3, 3], [4, 4]], ring) is False


def test_densificar_agrega_puntos():
    coords = [[0.0, 0.0], [0.1, 0.0]]  # ~11 km
    dense = densificar_polilinea(coords, max_step_m=1000)
    assert len(dense) > 5


def test_buffer_fuera_del_poligono():
    ring = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]
    pts = buffer_ring_outward(ring, meters=500, samples=8)
    assert len(pts) >= 4

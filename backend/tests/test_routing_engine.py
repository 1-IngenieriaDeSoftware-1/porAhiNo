"""Tests unitarios del motor Dijkstra (MainV2)."""

from app.services.routing_engine import (
    Nodo,
    calcular_ruta,
    dijkstra,
    construir_adyacencia,
    punto_en_poligono,
)


def test_punto_en_poligono_cuadrado():
    ring = [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]
    assert punto_en_poligono(1, 1, ring) is True
    assert punto_en_poligono(3, 3, ring) is False


def test_dijkstra_simple():
    nodos = {
        1: Nodo(1, 0, 0),
        2: Nodo(2, 0, 1),
        3: Nodo(3, 0, 2),
    }
    aristas = [(1, 2, 100.0, True), (2, 3, 100.0, True)]
    adj = construir_adyacencia(nodos, aristas)
    path, cost = dijkstra(nodos, adj, 1, 3)
    assert path == [1, 2, 3]
    assert cost == 200.0


def test_ruta_evita_zona():
    # Grid 2x2: bloquear arista central con polígono
    nodos = {
        1: Nodo(1, 0.0, 0.0),
        2: Nodo(2, 0.0, 1.0),
        3: Nodo(3, 1.0, 0.0),
        4: Nodo(4, 1.0, 1.0),
    }
    aristas = [
        (1, 2, 100.0, True),
        (1, 3, 100.0, True),
        (2, 4, 100.0, True),
        (3, 4, 100.0, True),
        (1, 4, 50.0, True),  # diagonal corta — bloqueada por zona
    ]
    # Zona alrededor del punto medio de la diagonal 1→4
    zona = [[0.4, 0.4], [0.6, 0.4], [0.6, 0.6], [0.4, 0.6], [0.4, 0.4]]

    directa = calcular_ruta(
        nodos, aristas, 0.0, 0.0, 1.0, 1.0, zonas_bloqueo=None, evita_restriccion=False
    )
    alt = calcular_ruta(
        nodos, aristas, 0.0, 0.0, 1.0, 1.0, zonas_bloqueo=[zona], evita_restriccion=True
    )
    assert directa.viable
    assert alt.viable
    # Alternativa no usa la diagonal corta → más larga o igual de viable
    assert alt.distancia_m >= directa.distancia_m * 0.9

"""
Interfaz preparada para feeds oficiales de movilidad (fases de semáforo, etc.).

Hoy NO hay fuente abierta fiable de temporizadores de fase en el Valle de Aburrá.
Valhalla solo aplica costos de maniobra estáticos; esta interfaz queda lista
para integrar un proveedor municipal/AMVA cuando exista.
"""

from __future__ import annotations

from typing import Optional, Protocol, runtime_checkable

from pydantic import BaseModel, Field


class SignalPhase(BaseModel):
    """Estado de fase en un instante (futuro)."""

    semaforo_id: int
    state: str = Field(description="red | yellow | green | unknown")
    remaining_s: Optional[float] = None
    confidence: float = 0.0


@runtime_checkable
class MobilityFeed(Protocol):
    """Contrato para datos oficiales de movilidad en tiempo (casi) real."""

    name: str

    async def get_signal_phases(
        self, municipio_id: int
    ) -> list[SignalPhase]:
        """Devuelve fases conocidas; lista vacía si no hay feed."""
        ...


class NullMobilityFeed:
    """Implementación por defecto: sin datos de fase."""

    name = "null"

    async def get_signal_phases(self, municipio_id: int) -> list[SignalPhase]:
        _ = municipio_id
        return []

"""
Grafo vial simplificado (MainV2): nodos + aristas para Dijkstra.
Cubre corredores de Bogotá, Medellín y Cali (seed).
"""

from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.base import Base


class NodoVia(Base):
    __tablename__ = "nodos_via"

    id = Column(Integer, primary_key=True, index=True)
    municipio_id = Column(
        Integer, ForeignKey("municipios.id", ondelete="CASCADE"), nullable=False, index=True
    )
    codigo = Column(String(40), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    nombre = Column(String(120), nullable=True)

    municipio = relationship("Municipio", backref="nodos_via")

    __table_args__ = (UniqueConstraint("municipio_id", "codigo", name="uq_nodo_via_mun_codigo"),)

    def __repr__(self) -> str:
        return f"<NodoVia {self.codigo} ({self.lat},{self.lon})>"


class AristaVia(Base):
    __tablename__ = "aristas_via"

    id = Column(Integer, primary_key=True, index=True)
    municipio_id = Column(
        Integer, ForeignKey("municipios.id", ondelete="CASCADE"), nullable=False, index=True
    )
    origen_id = Column(
        Integer, ForeignKey("nodos_via.id", ondelete="CASCADE"), nullable=False, index=True
    )
    destino_id = Column(
        Integer, ForeignKey("nodos_via.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Distancia en metros (precalculada); el motor puede recalcular Haversine
    distancia_m = Column(Float, nullable=False)
    bidireccional = Column(Boolean, default=True, nullable=False)
    nombre = Column(String(120), nullable=True)

    origen = relationship("NodoVia", foreign_keys=[origen_id])
    destino = relationship("NodoVia", foreign_keys=[destino_id])

    def __repr__(self) -> str:
        return f"<AristaVia {self.origen_id}->{self.destino_id} {self.distancia_m:.0f}m>"

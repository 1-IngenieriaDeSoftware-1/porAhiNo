"""
Modelo SQLAlchemy: Municipio

Representa los municipios colombianos con restricciones de Pico y Placa.
Se usa como catálogo de referencia para decretos y consultas.
"""

from sqlalchemy import Column, Float, Integer, String
from sqlalchemy.orm import relationship

from app.core.base import Base


class Municipio(Base):
    __tablename__ = "municipios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, index=True)
    departamento = Column(String(100), nullable=False, index=True)
    codigo_dane = Column(String(10), unique=True, nullable=True)  # Código DANE Colombia

    # Bbox operativo de navegación (data-driven; Valle de Aburrá para Medellín)
    bbox_lat_min = Column(Float, nullable=True)
    bbox_lat_max = Column(Float, nullable=True)
    bbox_lon_min = Column(Float, nullable=True)
    bbox_lon_max = Column(Float, nullable=True)

    # Relaciones
    decretos = relationship("Decreto", back_populates="municipio")
    consultas = relationship("Consulta", back_populates="municipio")

    def bbox_tuple(self) -> tuple[float, float, float, float] | None:
        """(lat_min, lat_max, lon_min, lon_max) o None si no está configurado."""
        if None in (
            self.bbox_lat_min,
            self.bbox_lat_max,
            self.bbox_lon_min,
            self.bbox_lon_max,
        ):
            return None
        return (
            float(self.bbox_lat_min),
            float(self.bbox_lat_max),
            float(self.bbox_lon_min),
            float(self.bbox_lon_max),
        )

    def __repr__(self) -> str:
        return f"<Municipio {self.nombre}, {self.departamento}>"

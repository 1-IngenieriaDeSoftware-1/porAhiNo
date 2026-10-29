"""
Zona geográfica de Pico y Placa (MainV2).

Polígono GeoJSON (lista de [lon, lat]) asociado a un municipio.
El motor de rutas bloquea aristas dentro del polígono cuando la placa está restringida.
"""

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.core.base import Base


class ZonaRestriccion(Base):
    __tablename__ = "zonas_restriccion"

    id = Column(Integer, primary_key=True, index=True)
    municipio_id = Column(
        Integer, ForeignKey("municipios.id", ondelete="CASCADE"), nullable=False, index=True
    )
    nombre = Column(String(120), nullable=False)
    # Ring exterior GeoJSON: [[lon, lat], ...] (cerrado o abierto)
    geometria = Column(JSONB, nullable=False)
    descripcion = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    municipio = relationship("Municipio", backref="zonas_restriccion")

    def __repr__(self) -> str:
        return f"<ZonaRestriccion {self.nombre} municipio={self.municipio_id}>"

"""Cámaras de fotomulta / control (capa informativa MainV2)."""

from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.base import Base


class Camara(Base):
    __tablename__ = "camaras"

    id = Column(Integer, primary_key=True, index=True)
    municipio_id = Column(
        Integer, ForeignKey("municipios.id", ondelete="SET NULL"), nullable=True, index=True
    )
    nombre = Column(String(160), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    tipo = Column(String(40), nullable=False, default="fotomulta")
    fuente = Column(String(120), nullable=True)
    notas = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    municipio = relationship("Municipio", backref="camaras")

    def __repr__(self) -> str:
        return f"<Camara {self.nombre} ({self.lat},{self.lon})>"

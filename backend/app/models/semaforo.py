"""Semáforos OSM (highway=traffic_signals) — capa mapa + costing Valhalla."""

from sqlalchemy import BigInteger, Boolean, Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.base import Base


class Semaforo(Base):
    __tablename__ = "semaforos"

    id = Column(Integer, primary_key=True)
    municipio_id = Column(
        Integer, ForeignKey("municipios.id", ondelete="SET NULL"), nullable=True, index=True
    )
    osm_id = Column(BigInteger, nullable=True, index=True)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    nombre = Column(String(160), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    municipio = relationship("Municipio")

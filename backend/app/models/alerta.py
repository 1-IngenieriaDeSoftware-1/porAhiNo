"""
Modelo: Alerta preventiva (US-005) — Release 2.

Tabla reservada. No se usa en el MVP (R1).
"""

from sqlalchemy import Boolean, Column, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import DateTime

from app.core.database import Base


class Alerta(Base):
    __tablename__ = "alertas"

    id = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    id_vehiculo = Column(Integer, ForeignKey("vehiculos.id"), nullable=False, index=True)
    minutos_antes = Column(Integer, nullable=False, default=60)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    usuario = relationship("Usuario")
    vehiculo = relationship("Vehiculo")

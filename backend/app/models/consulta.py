"""
Modelo SQLAlchemy: Consulta (Historial)

Registra cada consulta de restricción (US-DB-05) para auditoría y alertas (US-005).
Las consultas anónimas se guardan con id_usuario e id_vehiculo en NULL.
"""

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.base import Base


class Consulta(Base):
    __tablename__ = "consultas"

    id = Column(Integer, primary_key=True, index=True)
    id_vehiculo = Column(Integer, ForeignKey("vehiculos.id", ondelete="SET NULL"), nullable=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    municipio_id = Column(
        Integer, ForeignKey("municipios.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    fecha_consulta = Column(DateTime(timezone=True), server_default=func.now())
    fecha_verificada = Column(DateTime(timezone=True), nullable=False)
    placa_consultada = Column(String(10), nullable=False)
    resultado_restringido = Column(Boolean, nullable=False)

    vehiculo = relationship("Vehiculo", back_populates="consultas")
    usuario = relationship("Usuario", back_populates="consultas")
    municipio = relationship("Municipio", back_populates="consultas")

    def __repr__(self) -> str:
        return f"<Consulta placa={self.placa_consultada} municipio_id={self.municipio_id}>"

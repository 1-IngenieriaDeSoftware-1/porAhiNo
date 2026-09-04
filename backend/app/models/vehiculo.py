"""
Modelo SQLAlchemy: Vehiculo

Representa un vehículo registrado por un usuario conductor.
La placa se valida con formato colombiano (AAA000 o ABC12D).
"""

import enum
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.base import Base


class TipoVehiculo(str, enum.Enum):
    PARTICULAR = "particular"
    TAXI = "taxi"
    MOTO = "moto"
    CARGA = "carga"
    PUBLICO = "publico"


class Vehiculo(Base):
    __tablename__ = "vehiculos"

    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String(10), nullable=False, index=True)  # Formato: ABC123 o ABC12D
    tipo = Column(SAEnum(TipoVehiculo, native_enum=False, length=20), default=TipoVehiculo.PARTICULAR, nullable=False)
    alias = Column(String(100), nullable=True)  # Nombre amigable (ej: "Mi carro")
    id_usuario = Column(
        Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    usuario = relationship("Usuario", back_populates="vehiculos")
    consultas = relationship("Consulta", back_populates="vehiculo")

    def __repr__(self) -> str:
        return f"<Vehiculo placa={self.placa} tipo={self.tipo}>"

"""
Modelo SQLAlchemy: Decreto

Representa un decreto de Pico y Placa para un municipio específico.
Contiene los dígitos de placa restringidos, horarios y días de vigencia.

Índices en municipio_id + vigencia_desde/hasta para consultas en <1 segundo.
"""

from sqlalchemy import Boolean, Column, Date, ForeignKey, Index, Integer, String, Text, Time
from sqlalchemy.orm import relationship

from app.core.base import Base


class Decreto(Base):
    __tablename__ = "decretos"

    id = Column(Integer, primary_key=True, index=True)
    municipio_id = Column(
        Integer, ForeignKey("municipios.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    # Referencia legal
    numero_decreto = Column(String(50), nullable=True)
    descripcion = Column(Text, nullable=True)

    # Restricción horaria
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)

    # Días de la semana restringidos (0=Lunes, 6=Domingo)
    # Almacenados como JSON array en PostgreSQL
    dias_restriccion = Column(String(50), nullable=False)  # ej: "1,2,3,4,5"

    # Dígitos de placa restringidos (ej: "1,2" significa placas que terminan en 1 o 2)
    digitos_restringidos = Column(String(20), nullable=False)  # ej: "1,2"

    # Vigencia del decreto
    vigencia_desde = Column(Date, nullable=False, index=True)
    vigencia_hasta = Column(Date, nullable=True, index=True)  # NULL = vigente indefinidamente

    is_active = Column(Boolean, default=True, nullable=False)

    # Relaciones
    municipio = relationship("Municipio", back_populates="decretos")

    # Índice compuesto para optimizar consultas de restricción en <1 segundo
    __table_args__ = (
        Index("ix_decretos_municipio_vigencia", "municipio_id", "vigencia_desde", "vigencia_hasta"),
    )

    def __repr__(self) -> str:
        return f"<Decreto municipio_id={self.municipio_id} digitos={self.digitos_restringidos}>"

"""
Modelo SQLAlchemy: Municipio

Representa los municipios colombianos con restricciones de Pico y Placa.
Se usa como catálogo de referencia para decretos y consultas.
"""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Municipio(Base):
    __tablename__ = "municipios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, index=True)
    departamento = Column(String(100), nullable=False, index=True)
    codigo_dane = Column(String(10), unique=True, nullable=True)  # Código DANE Colombia

    # Relaciones
    decretos = relationship("Decreto", back_populates="municipio")
    consultas = relationship("Consulta", back_populates="municipio")

    def __repr__(self) -> str:
        return f"<Municipio {self.nombre}, {self.departamento}>"

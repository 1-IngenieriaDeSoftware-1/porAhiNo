"""
Modelo SQLAlchemy: Usuario

Representa tanto conductores como administradores del sistema.
La contraseña NUNCA se almacena en texto plano (Bcrypt via app/core/security.py).
Cumplimiento Ley 1581 de 2012 — datos personales mínimos necesarios.
"""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class RolUsuario(str, enum.Enum):
    CONDUCTOR = "conductor"
    ADMIN = "admin"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    rol = Column(SAEnum(RolUsuario), default=RolUsuario.CONDUCTOR, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    vehiculos = relationship("Vehiculo", back_populates="usuario", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Usuario id={self.id} email={self.email} rol={self.rol}>"

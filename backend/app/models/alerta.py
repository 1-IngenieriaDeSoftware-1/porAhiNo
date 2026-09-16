"""
Modelo: suscripción de alerta preventiva (US-DB-07 / US-005).

Un conductor se suscribe por vehículo con minutos de anticipación.
is_active es soft-delete: no se borra la fila.
"""

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.base import Base


class Alerta(Base):
    __tablename__ = "alertas"

    id = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(
        Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True
    )
    id_vehiculo = Column(
        Integer, ForeignKey("vehiculos.id", ondelete="CASCADE"), nullable=False, index=True
    )
    minutos_antes = Column(Integer, nullable=False, default=60)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    usuario = relationship("Usuario", back_populates="alertas")
    vehiculo = relationship("Vehiculo", back_populates="alertas")

    __table_args__ = (
        UniqueConstraint("id_usuario", "id_vehiculo", name="uq_alertas_usuario_vehiculo"),
        CheckConstraint("minutos_antes > 0", name="ck_alertas_minutos_antes"),
    )

    def desactivar(self) -> None:
        """Baja la suscripción sin borrar la fila (US-DB-07)."""
        self.is_active = False

    def __repr__(self) -> str:
        return (
            f"<Alerta usuario={self.id_usuario} vehiculo={self.id_vehiculo} "
            f"minutos={self.minutos_antes} active={self.is_active}>"
        )

"""
Modelos SQLAlchemy — representan las tablas de PostgreSQL.
Importar todos los modelos aquí para que Alembic los detecte.
"""

from app.models.usuario import Usuario
from app.models.municipio import Municipio
from app.models.decreto import Decreto
from app.models.vehiculo import Vehiculo
from app.models.consulta import Consulta

__all__ = ["Usuario", "Municipio", "Decreto", "Vehiculo", "Consulta"]

"""
Modelos SQLAlchemy — representan las tablas de PostgreSQL.
Importar todos los modelos aquí para que Alembic los detecte.
"""

from app.models.alerta import Alerta
from app.models.camara import Camara
from app.models.consulta import Consulta
from app.models.decreto import Decreto
from app.models.grafo_via import AristaVia, NodoVia
from app.models.municipio import Municipio
from app.models.push_subscription import PushSubscription
from app.models.usuario import Usuario
from app.models.vehiculo import Vehiculo
from app.models.zona_restriccion import ZonaRestriccion

__all__ = [
    "Usuario",
    "Municipio",
    "Decreto",
    "Vehiculo",
    "Consulta",
    "Alerta",
    "ZonaRestriccion",
    "Camara",
    "NodoVia",
    "AristaVia",
    "PushSubscription",
]

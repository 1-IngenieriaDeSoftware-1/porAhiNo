"""Metadata de SQLAlchemy, sin conexión a la base.

Alembic importa esto (y los modelos) sin necesitar SECRET_KEY ni el motor async.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass

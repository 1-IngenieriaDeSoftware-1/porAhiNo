"""US-DB-04: una placa no se puede repetir para el mismo usuario.

Revision ID: 002_uq_placa_usuario
Revises: 001_initial
Create Date: 2026-09-04
"""

from typing import Sequence, Union

from alembic import op

revision: str = "002_uq_placa_usuario"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_vehiculos_usuario_placa",
        "vehiculos",
        ["id_usuario", "placa"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_vehiculos_usuario_placa", "vehiculos", type_="unique")

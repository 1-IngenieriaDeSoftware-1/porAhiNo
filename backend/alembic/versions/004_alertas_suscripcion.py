"""US-DB-07: una suscripción de alerta por usuario+vehículo; minutos_antes > 0.

Revision ID: 004_alertas_sub
Revises: 003_idx_consulta
Create Date: 2026-09-16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "004_alertas_sub"
down_revision: Union[str, None] = "003_idx_consulta"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_alertas_usuario_vehiculo",
        "alertas",
        ["id_usuario", "id_vehiculo"],
    )
    op.create_check_constraint(
        "ck_alertas_minutos_antes",
        "alertas",
        "minutos_antes > 0",
    )


def downgrade() -> None:
    op.drop_constraint("ck_alertas_minutos_antes", "alertas", type_="check")
    op.drop_constraint("uq_alertas_usuario_vehiculo", "alertas", type_="unique")

"""US-DB-06: índices para consulta de decretos vigentes en <1 s (REQ-NFUNC-001).

Revision ID: 003_idx_consulta
Revises: 002_uq_placa_usuario
Create Date: 2026-09-16

ix_decretos_municipio_vigencia ya existe desde 001 (municipio_id + vigencia_desde
+ vigencia_hasta). Aquí se agrega el índice parcial que usa la query real
(is_active = true) para evitar seq scan amplio.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003_idx_consulta"
down_revision: Union[str, None] = "002_uq_placa_usuario"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_decretos_consulta_vigente",
        "decretos",
        ["municipio_id", "vigencia_desde", "vigencia_hasta"],
        postgresql_where=sa.text("is_active = true"),
    )


def downgrade() -> None:
    op.drop_index("ix_decretos_consulta_vigente", table_name="decretos")

"""MainV2: zonas, cámaras, grafo vial, push subscriptions.

Revision ID: 005_mainv2_rutas
Revises: 004_alertas_sub
Create Date: 2026-10-28
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "005_mainv2_rutas"
down_revision: Union[str, None] = "004_alertas_sub"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "zonas_restriccion",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("municipio_id", sa.Integer(), sa.ForeignKey("municipios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("nombre", sa.String(120), nullable=False),
        sa.Column("geometria", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_index("ix_zonas_restriccion_municipio_id", "zonas_restriccion", ["municipio_id"])

    op.create_table(
        "camaras",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("municipio_id", sa.Integer(), sa.ForeignKey("municipios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("nombre", sa.String(160), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.Column("tipo", sa.String(40), nullable=False, server_default="fotomulta"),
        sa.Column("fuente", sa.String(120), nullable=True),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_index("ix_camaras_municipio_id", "camaras", ["municipio_id"])

    op.create_table(
        "nodos_via",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("municipio_id", sa.Integer(), sa.ForeignKey("municipios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("codigo", sa.String(40), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.Column("nombre", sa.String(120), nullable=True),
        sa.UniqueConstraint("municipio_id", "codigo", name="uq_nodo_via_mun_codigo"),
    )
    op.create_index("ix_nodos_via_municipio_id", "nodos_via", ["municipio_id"])

    op.create_table(
        "aristas_via",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("municipio_id", sa.Integer(), sa.ForeignKey("municipios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("origen_id", sa.Integer(), sa.ForeignKey("nodos_via.id", ondelete="CASCADE"), nullable=False),
        sa.Column("destino_id", sa.Integer(), sa.ForeignKey("nodos_via.id", ondelete="CASCADE"), nullable=False),
        sa.Column("distancia_m", sa.Float(), nullable=False),
        sa.Column("bidireccional", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("nombre", sa.String(120), nullable=True),
    )
    op.create_index("ix_aristas_via_municipio_id", "aristas_via", ["municipio_id"])
    op.create_index("ix_aristas_via_origen_id", "aristas_via", ["origen_id"])
    op.create_index("ix_aristas_via_destino_id", "aristas_via", ["destino_id"])

    op.create_table(
        "push_subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("endpoint", sa.Text(), nullable=False),
        sa.Column("p256dh", sa.String(255), nullable=False),
        sa.Column("auth", sa.String(255), nullable=False),
        sa.Column("user_agent", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("endpoint", name="uq_push_endpoint"),
    )
    op.create_index("ix_push_subscriptions_usuario_id", "push_subscriptions", ["usuario_id"])


def downgrade() -> None:
    op.drop_table("push_subscriptions")
    op.drop_table("aristas_via")
    op.drop_table("nodos_via")
    op.drop_table("camaras")
    op.drop_table("zonas_restriccion")

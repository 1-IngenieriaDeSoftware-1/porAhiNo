"""Bbox por municipio + tabla semaforos (routing Valhalla / capas mapa).

Revision ID: 006_bbox_semaforos
Revises: 005_mainv2_rutas
Create Date: 2026-11-01
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "006_bbox_semaforos"
down_revision: Union[str, None] = "005_mainv2_rutas"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("municipios", sa.Column("bbox_lat_min", sa.Float(), nullable=True))
    op.add_column("municipios", sa.Column("bbox_lat_max", sa.Float(), nullable=True))
    op.add_column("municipios", sa.Column("bbox_lon_min", sa.Float(), nullable=True))
    op.add_column("municipios", sa.Column("bbox_lon_max", sa.Float(), nullable=True))

    # Valle de Aburrá ampliado (Bello–Barbosa N, Caldas/La Estrella S)
    op.execute(
        """
        UPDATE municipios SET
          bbox_lat_min = 6.05, bbox_lat_max = 6.55,
          bbox_lon_min = -75.75, bbox_lon_max = -75.40
        WHERE nombre = 'Medellín'
        """
    )
    op.execute(
        """
        UPDATE municipios SET
          bbox_lat_min = 4.45, bbox_lat_max = 4.85,
          bbox_lon_min = -74.25, bbox_lon_max = -73.95
        WHERE nombre = 'Bogotá'
        """
    )
    op.execute(
        """
        UPDATE municipios SET
          bbox_lat_min = 3.30, bbox_lat_max = 3.55,
          bbox_lon_min = -76.65, bbox_lon_max = -76.45
        WHERE nombre = 'Cali'
        """
    )

    op.create_table(
        "semaforos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "municipio_id",
            sa.Integer(),
            sa.ForeignKey("municipios.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("osm_id", sa.BigInteger(), nullable=True),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.Column("nombre", sa.String(160), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_index("ix_semaforos_municipio_id", "semaforos", ["municipio_id"])
    op.create_index("ix_semaforos_osm_id", "semaforos", ["osm_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_semaforos_osm_id", table_name="semaforos")
    op.drop_index("ix_semaforos_municipio_id", table_name="semaforos")
    op.drop_table("semaforos")
    op.drop_column("municipios", "bbox_lon_max")
    op.drop_column("municipios", "bbox_lon_min")
    op.drop_column("municipios", "bbox_lat_max")
    op.drop_column("municipios", "bbox_lat_min")

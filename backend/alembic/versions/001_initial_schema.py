"""US-DB-01: esquema inicial porAhiNo (PostgreSQL local en Docker).

Revision ID: 001_initial
Revises:
Create Date: 2026-09-03

Tablas: usuarios, municipios, decretos, vehiculos, consultas, alertas.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "usuarios",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("rol", sa.String(20), nullable=False, server_default="conductor"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_usuarios_email", "usuarios", ["email"], unique=True)
    op.create_index("ix_usuarios_id", "usuarios", ["id"])

    op.create_table(
        "municipios",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("departamento", sa.String(100), nullable=False),
        sa.Column("codigo_dane", sa.String(10), nullable=True),
    )
    op.create_index("ix_municipios_id", "municipios", ["id"])
    op.create_index("ix_municipios_nombre", "municipios", ["nombre"])
    op.create_index("ix_municipios_departamento", "municipios", ["departamento"])
    op.create_index("ix_municipios_codigo_dane", "municipios", ["codigo_dane"], unique=True)

    op.create_table(
        "decretos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("municipio_id", sa.Integer(), nullable=False),
        sa.Column("numero_decreto", sa.String(50), nullable=True),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("hora_inicio", sa.Time(), nullable=False),
        sa.Column("hora_fin", sa.Time(), nullable=False),
        sa.Column("dias_restriccion", sa.String(50), nullable=False),
        sa.Column("digitos_restringidos", sa.String(20), nullable=False),
        sa.Column("vigencia_desde", sa.Date(), nullable=False),
        sa.Column("vigencia_hasta", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.ForeignKeyConstraint(
            ["municipio_id"],
            ["municipios.id"],
            name="fk_decretos_municipio_id",
            ondelete="RESTRICT",
        ),
    )
    op.create_index("ix_decretos_id", "decretos", ["id"])
    op.create_index("ix_decretos_municipio_id", "decretos", ["municipio_id"])
    op.create_index("ix_decretos_vigencia_desde", "decretos", ["vigencia_desde"])
    op.create_index("ix_decretos_vigencia_hasta", "decretos", ["vigencia_hasta"])
    op.create_index(
        "ix_decretos_municipio_vigencia",
        "decretos",
        ["municipio_id", "vigencia_desde", "vigencia_hasta"],
    )

    op.create_table(
        "vehiculos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("placa", sa.String(10), nullable=False),
        sa.Column("tipo", sa.String(20), nullable=False, server_default="particular"),
        sa.Column("alias", sa.String(100), nullable=True),
        sa.Column("id_usuario", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(
            ["id_usuario"],
            ["usuarios.id"],
            name="fk_vehiculos_id_usuario",
            ondelete="CASCADE",
        ),
    )
    op.create_index("ix_vehiculos_id", "vehiculos", ["id"])
    op.create_index("ix_vehiculos_placa", "vehiculos", ["placa"])
    op.create_index("ix_vehiculos_id_usuario", "vehiculos", ["id_usuario"])

    op.create_table(
        "consultas",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("id_vehiculo", sa.Integer(), nullable=True),
        sa.Column("id_usuario", sa.Integer(), nullable=True),
        sa.Column("municipio_id", sa.Integer(), nullable=False),
        sa.Column("fecha_consulta", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("fecha_verificada", sa.DateTime(timezone=True), nullable=False),
        sa.Column("placa_consultada", sa.String(10), nullable=False),
        sa.Column("resultado_restringido", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(
            ["id_vehiculo"],
            ["vehiculos.id"],
            name="fk_consultas_id_vehiculo",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["id_usuario"],
            ["usuarios.id"],
            name="fk_consultas_id_usuario",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["municipio_id"],
            ["municipios.id"],
            name="fk_consultas_municipio_id",
            ondelete="RESTRICT",
        ),
    )
    op.create_index("ix_consultas_id", "consultas", ["id"])
    op.create_index("ix_consultas_municipio_id", "consultas", ["municipio_id"])

    op.create_table(
        "alertas",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("id_usuario", sa.Integer(), nullable=False),
        sa.Column("id_vehiculo", sa.Integer(), nullable=False),
        sa.Column("minutos_antes", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(
            ["id_usuario"],
            ["usuarios.id"],
            name="fk_alertas_id_usuario",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["id_vehiculo"],
            ["vehiculos.id"],
            name="fk_alertas_id_vehiculo",
            ondelete="CASCADE",
        ),
    )
    op.create_index("ix_alertas_id", "alertas", ["id"])
    op.create_index("ix_alertas_id_usuario", "alertas", ["id_usuario"])
    op.create_index("ix_alertas_id_vehiculo", "alertas", ["id_vehiculo"])


def downgrade() -> None:
    op.drop_table("alertas")
    op.drop_table("consultas")
    op.drop_table("vehiculos")
    op.drop_table("decretos")
    op.drop_table("municipios")
    op.drop_table("usuarios")

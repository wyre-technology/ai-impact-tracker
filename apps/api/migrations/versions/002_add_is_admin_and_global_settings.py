"""Add is_admin column to engineers and global_settings table.

Revision ID: 002
Revises: 001
Create Date: 2026-03-25
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "engineers",
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )

    op.create_table(
        "global_settings",
        sa.Column("key", sa.Text(), primary_key=True),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # Seed the default hourly rate setting
    op.execute("INSERT INTO global_settings (key, value) VALUES ('default_hourly_rate', '225.00')")


def downgrade() -> None:
    op.drop_table("global_settings")
    op.drop_column("engineers", "is_admin")

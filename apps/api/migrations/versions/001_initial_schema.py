"""Initial schema: engineers, clients, sessions.

Revision ID: 001
Revises: None
Create Date: 2025-03-25
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "engineers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("entra_oid", sa.Text(), nullable=False, unique=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("email", sa.Text(), nullable=False, unique=True),
        sa.Column("default_hourly_rate", sa.Numeric(7, 2), nullable=False, server_default=sa.text("225.00")),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "clients",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("slug", sa.Text(), nullable=False, unique=True),
        sa.Column("monthly_mrr", sa.Numeric(10, 2), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "sessions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("engineer_id", UUID(as_uuid=True), sa.ForeignKey("engineers.id"), nullable=False),
        sa.Column("client_id", UUID(as_uuid=True), sa.ForeignKey("clients.id"), nullable=True),
        sa.Column("project", sa.Text(), nullable=False),
        sa.Column("task_summary", sa.Text(), nullable=False),
        sa.Column("task_type", sa.Text(), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("tool_calls", JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("files_created", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("files_modified", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("lines_added", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("lines_removed", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("estimated_manual_hours", sa.Numeric(5, 2), nullable=False),
        sa.Column("hourly_rate", sa.Numeric(7, 2), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("session_metadata", JSONB(), server_default=sa.text("'{}'::jsonb")),
    )


def downgrade() -> None:
    op.drop_table("sessions")
    op.drop_table("clients")
    op.drop_table("engineers")

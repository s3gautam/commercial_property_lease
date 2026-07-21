"""visits table

Revision ID: 0003_visits
Revises: 0002_lease_version_document_text
Create Date: 2026-07-22

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003_visits"
down_revision: str | None = "0002_lease_version_document_text"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

visit_status = postgresql.ENUM("UPCOMING", "CANCELLED", name="visit_status", create_type=False)


def upgrade() -> None:
    visit_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "visits",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "property_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("properties.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("visit_date", sa.Date(), nullable=False),
        sa.Column("visit_time", sa.String(20), nullable=False),
        sa.Column("status", visit_status, nullable=False, server_default="UPCOMING"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index("ix_visits_property_id", "visits", ["property_id"])
    op.create_index("ix_visits_tenant_id", "visits", ["tenant_id"])


def downgrade() -> None:
    op.drop_index("ix_visits_tenant_id", table_name="visits")
    op.drop_index("ix_visits_property_id", table_name="visits")
    op.drop_table("visits")
    visit_status.drop(op.get_bind(), checkfirst=True)

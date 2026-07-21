"""watchlist_items table

Revision ID: 0004_watchlist_items
Revises: 0003_visits
Create Date: 2026-07-22

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004_watchlist_items"
down_revision: str | None = "0003_visits"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "watchlist_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "property_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("properties.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.UniqueConstraint("tenant_id", "property_id", name="uq_watchlist_tenant_property"),
    )
    op.create_index("ix_watchlist_items_tenant_id", "watchlist_items", ["tenant_id"])
    op.create_index("ix_watchlist_items_property_id", "watchlist_items", ["property_id"])


def downgrade() -> None:
    op.drop_index("ix_watchlist_items_property_id", table_name="watchlist_items")
    op.drop_index("ix_watchlist_items_tenant_id", table_name="watchlist_items")
    op.drop_table("watchlist_items")

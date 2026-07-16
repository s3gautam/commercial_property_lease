"""lease version document_text and nullable document_url

Revision ID: 0002_lease_version_document_text
Revises: 0001_initial_schema
Create Date: 2026-07-16

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_lease_version_document_text"
down_revision: str | None = "0001_initial_schema"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("lease_versions", sa.Column("document_text", sa.Text(), nullable=True))
    op.alter_column("lease_versions", "document_url", existing_type=sa.String(1000), nullable=True)


def downgrade() -> None:
    op.alter_column("lease_versions", "document_url", existing_type=sa.String(1000), nullable=False)
    op.drop_column("lease_versions", "document_text")

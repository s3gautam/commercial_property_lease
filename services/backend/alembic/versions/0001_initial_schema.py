"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-07-16

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def _audit_columns() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
    ]


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(32), nullable=True),
        sa.Column(
            "role",
            sa.Enum("TENANT", "LANDLORD", "BROKER", "ADMIN", name="user_role"),
            nullable=False,
        ),
        sa.Column("google_id", sa.String(255), nullable=True),
        sa.Column("is_email_verified", sa.Boolean(), nullable=False),
        sa.Column("is_phone_verified", sa.Boolean(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        *_audit_columns(),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("phone"),
        sa.UniqueConstraint("google_id"),
        sa.CheckConstraint("email IS NOT NULL OR phone IS NOT NULL", name="ck_users_email_or_phone"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_phone", "users", ["phone"])
    op.create_index("ix_users_google_id", "users", ["google_id"])

    op.create_table(
        "tenant_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_name", sa.String(255), nullable=True),
        sa.Column("business_type", sa.String(100), nullable=True),
        *_audit_columns(),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "properties",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("landlord_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("address", sa.String(500), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("state", sa.String(100), nullable=False),
        sa.Column("country", sa.String(100), nullable=False),
        sa.Column("area_sqft", sa.Numeric(10, 2), nullable=False),
        sa.Column("monthly_rent", sa.Numeric(12, 2), nullable=False),
        sa.Column(
            "status",
            sa.Enum("DRAFT", "LISTED", "LEASED", "ARCHIVED", name="property_status"),
            nullable=False,
        ),
        *_audit_columns(),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["landlord_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_properties_city", "properties", ["city"])
    op.create_index("ix_properties_status", "properties", ["status"])
    op.create_index("ix_properties_city_status", "properties", ["city", "status"])

    op.create_table(
        "property_images",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("property_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("url", sa.String(1000), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        *_audit_columns(),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_property_images_property_id", "property_images", ["property_id"])

    op.create_table(
        "property_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("property_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("document_type", sa.String(100), nullable=False),
        sa.Column("url", sa.String(1000), nullable=False),
        *_audit_columns(),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_property_documents_property_id", "property_documents", ["property_id"])

    op.create_table(
        "verification_reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("property_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("risk_score", sa.Numeric(5, 2), nullable=True),
        sa.Column(
            "status",
            sa.Enum("PENDING", "COMPLETED", "FAILED", name="verification_report_status"),
            nullable=False,
        ),
        *_audit_columns(),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_verification_reports_property_id", "verification_reports", ["property_id"])

    op.create_table(
        "chat_threads",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("property_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("landlord_id", postgresql.UUID(as_uuid=True), nullable=False),
        *_audit_columns(),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["tenant_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["landlord_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_chat_threads_tenant_id", "chat_threads", ["tenant_id"])
    op.create_index("ix_chat_threads_landlord_id", "chat_threads", ["landlord_id"])

    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("thread_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sender_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        *_audit_columns(),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["thread_id"], ["chat_threads.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_messages_thread_created", "messages", ["thread_id", "created_at"])

    op.create_table(
        "leases",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("property_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "DRAFT", "PENDING_SIGNATURE", "SIGNED", "TERMINATED", name="lease_status"
            ),
            nullable=False,
        ),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("monthly_rent", sa.Numeric(12, 2), nullable=False),
        *_audit_columns(),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tenant_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_leases_property_id", "leases", ["property_id"])
    op.create_index("ix_leases_tenant_id", "leases", ["tenant_id"])

    op.create_table(
        "lease_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("lease_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("document_url", sa.String(1000), nullable=False),
        sa.Column("ai_summary", sa.Text(), nullable=True),
        *_audit_columns(),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["lease_id"], ["leases.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_lease_versions_lease_id", "lease_versions", ["lease_id"])

    op.create_table(
        "kyc_verifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("document_type", sa.String(100), nullable=False),
        sa.Column("document_url", sa.String(1000), nullable=False),
        sa.Column(
            "status",
            sa.Enum("PENDING", "VERIFIED", "REJECTED", name="kyc_status"),
            nullable=False,
        ),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        *_audit_columns(),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_kyc_verifications_user_id", "kyc_verifications", ["user_id"])

    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False),
        *_audit_columns(),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])

    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(100), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("extra_data", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_audit_logs_entity", "audit_logs", ["entity_type", "entity_id"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("notifications")
    op.drop_table("kyc_verifications")
    op.drop_table("lease_versions")
    op.drop_table("leases")
    op.drop_table("messages")
    op.drop_table("chat_threads")
    op.drop_table("verification_reports")
    op.drop_table("property_documents")
    op.drop_table("property_images")
    op.drop_table("properties")
    op.drop_table("tenant_profiles")
    op.drop_table("users")

    sa.Enum(name="kyc_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="lease_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="verification_report_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="property_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="user_role").drop(op.get_bind(), checkfirst=True)

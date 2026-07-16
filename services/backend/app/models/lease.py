import enum
import uuid
from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampedModel


class LeaseStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_SIGNATURE = "pending_signature"
    SIGNED = "signed"
    TERMINATED = "terminated"


class Lease(TimestampedModel):
    __tablename__ = "leases"

    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[LeaseStatus] = mapped_column(
        Enum(LeaseStatus, name="lease_status"), default=LeaseStatus.DRAFT, nullable=False
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    monthly_rent: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    versions: Mapped[list["LeaseVersion"]] = relationship(
        back_populates="lease",
        cascade="all, delete-orphan",
        order_by="LeaseVersion.version_number",
    )


class LeaseVersion(TimestampedModel):
    __tablename__ = "lease_versions"

    lease_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("leases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version_number: Mapped[int] = mapped_column(nullable=False)
    # Nullable because generated drafts aren't uploaded to object storage yet
    # (no S3 client wired up) — see document_text for the generated text in
    # the meantime. Once file storage lands, drafts get rendered to a file
    # and this is populated.
    document_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    document_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    lease: Mapped["Lease"] = relationship(back_populates="versions")

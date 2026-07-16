import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampedModel
from app.services.property_facts import NearbyLandmark, get_amenities, get_nearby_landmarks


class PropertyStatus(str, enum.Enum):
    DRAFT = "draft"
    LISTED = "listed"
    LEASED = "leased"
    ARCHIVED = "archived"


class Property(TimestampedModel):
    __tablename__ = "properties"
    __table_args__ = (
        Index("ix_properties_city_status", "city", "status"),
    )

    landlord_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    area_sqft: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    monthly_rent: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[PropertyStatus] = mapped_column(
        Enum(PropertyStatus, name="property_status"),
        default=PropertyStatus.DRAFT,
        nullable=False,
        index=True,
    )

    images: Mapped[list["PropertyImage"]] = relationship(
        back_populates="property", cascade="all, delete-orphan", order_by="PropertyImage.position"
    )
    documents: Mapped[list["PropertyDocument"]] = relationship(
        back_populates="property", cascade="all, delete-orphan"
    )

    @property
    def amenities(self) -> list[str]:
        """Deterministic, not stored - see app.services.property_facts."""
        return get_amenities(self.id)

    @property
    def nearby_landmarks(self) -> list[NearbyLandmark]:
        """Deterministic, not stored - see app.services.property_facts."""
        return get_nearby_landmarks(self.id, self.city)


class PropertyImage(TimestampedModel):
    __tablename__ = "property_images"

    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    position: Mapped[int] = mapped_column(default=0, nullable=False)

    property: Mapped["Property"] = relationship(back_populates="images")


class PropertyDocument(TimestampedModel):
    __tablename__ = "property_documents"

    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_type: Mapped[str] = mapped_column(String(100), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)

    property: Mapped["Property"] = relationship(back_populates="documents")


class VerificationReportStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class VerificationReport(TimestampedModel):
    __tablename__ = "verification_reports"

    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    risk_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    status: Mapped[VerificationReportStatus] = mapped_column(
        Enum(VerificationReportStatus, name="verification_report_status"),
        default=VerificationReportStatus.PENDING,
        nullable=False,
    )

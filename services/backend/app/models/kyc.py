import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampedModel


class KYCStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class KYCVerification(TimestampedModel):
    __tablename__ = "kyc_verifications"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_type: Mapped[str] = mapped_column(String(100), nullable=False)
    document_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    status: Mapped[KYCStatus] = mapped_column(
        Enum(KYCStatus, name="kyc_status"), default=KYCStatus.PENDING, nullable=False
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

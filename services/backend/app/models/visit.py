import enum
import uuid
from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampedModel


class VisitStatus(str, enum.Enum):
    UPCOMING = "upcoming"
    CANCELLED = "cancelled"


class Visit(TimestampedModel):
    __tablename__ = "visits"

    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    visit_date: Mapped[date] = mapped_column(Date, nullable=False)
    # "H:MM AM/PM", matching the slot format used throughout
    # app/services/visit_schedule.py and apps/web/lib/property-schedule.ts
    visit_time: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[VisitStatus] = mapped_column(
        Enum(VisitStatus, name="visit_status"), default=VisitStatus.UPCOMING, nullable=False
    )

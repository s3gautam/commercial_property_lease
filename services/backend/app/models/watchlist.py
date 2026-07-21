import uuid

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import ImmutableModel


class WatchlistItem(ImmutableModel):
    """A tenant saving a property to their watchlist - append/delete only,
    never updated in place, so this never needs an updated_at."""

    __tablename__ = "watchlist_items"
    __table_args__ = (UniqueConstraint("tenant_id", "property_id", name="uq_watchlist_tenant_property"),)

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True
    )

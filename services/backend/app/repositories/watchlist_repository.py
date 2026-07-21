import uuid

from sqlalchemy import delete, select

from app.models.property import Property
from app.models.watchlist import WatchlistItem
from app.repositories.base import BaseRepository


class WatchlistRepository(BaseRepository[WatchlistItem]):
    model = WatchlistItem

    async def list_properties_for_tenant(self, tenant_id: uuid.UUID) -> list[Property]:
        result = await self.session.execute(
            select(Property)
            .join(WatchlistItem, WatchlistItem.property_id == Property.id)
            .where(WatchlistItem.tenant_id == tenant_id)
            .order_by(WatchlistItem.created_at.desc())
        )
        return list(result.scalars().all())

    async def find(self, tenant_id: uuid.UUID, property_id: uuid.UUID) -> WatchlistItem | None:
        result = await self.session.execute(
            select(WatchlistItem).where(
                WatchlistItem.tenant_id == tenant_id, WatchlistItem.property_id == property_id
            )
        )
        return result.scalar_one_or_none()

    async def remove(self, tenant_id: uuid.UUID, property_id: uuid.UUID) -> None:
        await self.session.execute(
            delete(WatchlistItem).where(
                WatchlistItem.tenant_id == tenant_id, WatchlistItem.property_id == property_id
            )
        )

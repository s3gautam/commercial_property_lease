import uuid

from app.models.property import Property
from app.models.watchlist import WatchlistItem
from app.repositories.property_repository import PropertyRepository
from app.repositories.watchlist_repository import WatchlistRepository


class PropertyNotFoundError(Exception):
    pass


class WatchlistService:
    def __init__(self, watchlist: WatchlistRepository, properties: PropertyRepository) -> None:
        self._watchlist = watchlist
        self._properties = properties

    async def list_my_watchlist(self, tenant_id: uuid.UUID) -> list[Property]:
        return await self._watchlist.list_properties_for_tenant(tenant_id)

    async def add(self, tenant_id: uuid.UUID, property_id: uuid.UUID) -> Property:
        property_ = await self._properties.get_by_id(property_id)
        if property_ is None:
            raise PropertyNotFoundError("Property not found")

        existing = await self._watchlist.find(tenant_id, property_id)
        if existing is None:
            await self._watchlist.create(
                WatchlistItem(tenant_id=tenant_id, property_id=property_id)
            )
        return property_

    async def remove(self, tenant_id: uuid.UUID, property_id: uuid.UUID) -> None:
        await self._watchlist.remove(tenant_id, property_id)

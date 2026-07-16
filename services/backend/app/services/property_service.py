import uuid

from app.models.property import Property, PropertyStatus
from app.repositories.property_repository import PropertyRepository


class PropertyNotFoundError(Exception):
    pass


class PropertyService:
    def __init__(self, properties: PropertyRepository) -> None:
        self._properties = properties

    async def browse(
        self, page: int, page_size: int, city: str | None
    ) -> tuple[list[Property], int]:
        offset = (page - 1) * page_size
        return await self._properties.list_listed(limit=page_size, offset=offset, city=city)

    async def get_listed_property(self, property_id: uuid.UUID) -> Property:
        property_ = await self._properties.get_by_id(property_id)
        if property_ is None or property_.status != PropertyStatus.LISTED:
            raise PropertyNotFoundError("Property not found")
        return property_

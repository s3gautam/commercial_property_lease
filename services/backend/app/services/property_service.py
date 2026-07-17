import uuid

from app.ai.agents.search_agent import SearchAgent, SearchResult
from app.ai.base_agent import AgentResponse
from app.models.property import Property, PropertyStatus
from app.repositories.property_repository import PropertyRepository


class PropertyNotFoundError(Exception):
    pass


class PropertyService:
    def __init__(self, properties: PropertyRepository) -> None:
        self._properties = properties

    async def browse(
        self,
        page: int,
        page_size: int,
        city: str | None,
        min_rent: float | None = None,
        max_rent: float | None = None,
        min_area_sqft: float | None = None,
        max_area_sqft: float | None = None,
        property_type: str | None = None,
        amenities: list[str] | None = None,
    ) -> tuple[list[Property], int]:
        offset = (page - 1) * page_size

        if not amenities:
            return await self._properties.list_listed(
                limit=page_size,
                offset=offset,
                city=city,
                min_rent=min_rent,
                max_rent=max_rent,
                min_area_sqft=min_area_sqft,
                max_area_sqft=max_area_sqft,
                property_type=property_type,
            )

        # Amenities aren't a real column (Property.amenities is computed -
        # see app/services/property_facts.py), so they can't be filtered
        # in SQL. Fetch every row matching the SQL-filterable criteria,
        # filter by amenities in Python, then paginate the filtered list
        # ourselves. Fine at this dataset's scale (dozens of rows); would
        # need a real amenities table/index to stay SQL-side at a larger
        # scale.
        all_matching, _ = await self._properties.list_listed(
            limit=None,
            offset=0,
            city=city,
            min_rent=min_rent,
            max_rent=max_rent,
            min_area_sqft=min_area_sqft,
            max_area_sqft=max_area_sqft,
            property_type=property_type,
        )
        required = set(amenities)
        filtered = [p for p in all_matching if required.issubset(set(p.amenities))]
        total = len(filtered)
        page_items = filtered[offset : offset + page_size]
        return page_items, total

    async def get_listed_property(self, property_id: uuid.UUID) -> Property:
        property_ = await self._properties.get_by_id(property_id)
        if property_ is None or property_.status != PropertyStatus.LISTED:
            raise PropertyNotFoundError("Property not found")
        return property_

    async def search(self, query: str, limit: int = 20) -> AgentResponse[SearchResult]:
        agent = SearchAgent(self._properties)
        return await agent.run(query=query, limit=limit)

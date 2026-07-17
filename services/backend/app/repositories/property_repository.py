from sqlalchemy import ColumnElement, func, or_, select

from app.models.property import Property, PropertyStatus
from app.repositories.base import BaseRepository


class PropertyRepository(BaseRepository[Property]):
    model = Property

    async def list_listed(
        self,
        limit: int | None,
        offset: int,
        city: str | None = None,
        min_rent: float | None = None,
        max_rent: float | None = None,
        min_area_sqft: float | None = None,
        max_area_sqft: float | None = None,
        property_type: str | None = None,
    ) -> tuple[list[Property], int]:
        """`limit=None` returns every matching row (no SQL-level paging) -
        used when the caller needs to apply a further filter in Python
        (amenities aren't a real column - see PropertyService.browse) and
        has to paginate the final filtered list itself instead."""
        filters: list[ColumnElement[bool]] = [Property.status == PropertyStatus.LISTED]
        if city is not None:
            filters.append(Property.city.ilike(city))
        if min_rent is not None:
            filters.append(Property.monthly_rent >= min_rent)
        if max_rent is not None:
            filters.append(Property.monthly_rent <= max_rent)
        if min_area_sqft is not None:
            filters.append(Property.area_sqft >= min_area_sqft)
        if max_area_sqft is not None:
            filters.append(Property.area_sqft <= max_area_sqft)
        if property_type:
            filters.append(Property.title.ilike(f"%{property_type}%"))

        base_query = select(Property).where(*filters)

        count_result = await self.session.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()

        ordered_query = base_query.order_by(Property.created_at.desc())
        if limit is not None:
            ordered_query = ordered_query.limit(limit).offset(offset)

        result = await self.session.execute(ordered_query)
        return list(result.scalars().all()), total

    async def search_listed(
        self,
        limit: int,
        city: str | None = None,
        max_rent: float | None = None,
        min_area_sqft: float | None = None,
        keywords: list[str] | None = None,
    ) -> list[Property]:
        filters: list[ColumnElement[bool]] = [Property.status == PropertyStatus.LISTED]

        if city:
            filters.append(Property.city.ilike(city))
        if max_rent is not None:
            filters.append(Property.monthly_rent <= max_rent)
        if min_area_sqft is not None:
            filters.append(Property.area_sqft >= min_area_sqft)
        if keywords:
            keyword_filters = [
                or_(Property.title.ilike(f"%{kw}%"), Property.description.ilike(f"%{kw}%"))
                for kw in keywords
            ]
            filters.append(or_(*keyword_filters))

        query = (
            select(Property)
            .where(*filters)
            .order_by(Property.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

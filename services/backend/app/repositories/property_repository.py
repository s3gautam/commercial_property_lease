from sqlalchemy import func, select

from app.models.property import Property, PropertyStatus
from app.repositories.base import BaseRepository


class PropertyRepository(BaseRepository[Property]):
    model = Property

    async def list_listed(
        self,
        limit: int,
        offset: int,
        city: str | None = None,
    ) -> tuple[list[Property], int]:
        filters = [Property.status == PropertyStatus.LISTED]
        if city is not None:
            filters.append(Property.city.ilike(city))

        base_query = select(Property).where(*filters)

        count_result = await self.session.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()

        result = await self.session.execute(
            base_query.order_by(Property.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

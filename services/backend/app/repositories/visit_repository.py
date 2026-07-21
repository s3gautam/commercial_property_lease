import uuid
from datetime import date

from sqlalchemy import select

from app.models.visit import Visit, VisitStatus
from app.repositories.base import BaseRepository


class VisitRepository(BaseRepository[Visit]):
    model = Visit

    async def list_for_tenant(self, tenant_id: uuid.UUID) -> list[Visit]:
        result = await self.session.execute(
            select(Visit)
            .where(Visit.tenant_id == tenant_id)
            .order_by(Visit.visit_date, Visit.visit_time)
        )
        return list(result.scalars().all())

    async def list_upcoming_for_tenant(
        self, tenant_id: uuid.UUID, exclude_visit_id: uuid.UUID | None = None
    ) -> list[Visit]:
        filters = [Visit.tenant_id == tenant_id, Visit.status == VisitStatus.UPCOMING]
        if exclude_visit_id is not None:
            filters.append(Visit.id != exclude_visit_id)
        result = await self.session.execute(select(Visit).where(*filters))
        return list(result.scalars().all())

    async def find_conflict(
        self,
        tenant_id: uuid.UUID,
        property_id: uuid.UUID,
        visit_date: date,
        visit_time: str,
        exclude_visit_id: uuid.UUID | None = None,
    ) -> Visit | None:
        """Two rules enforced here (the only place visits are created/moved,
        so this is the single source of truth for both): a tenant can't have
        more than one upcoming visit for the same property, and can't have
        two upcoming visits at the same date+time across different
        properties."""
        upcoming = await self.list_upcoming_for_tenant(tenant_id, exclude_visit_id)
        for visit in upcoming:
            if visit.property_id == property_id:
                return visit
            if visit.visit_date == visit_date and visit.visit_time == visit_time:
                return visit
        return None

import uuid

from sqlalchemy import select

from app.models.lease import Lease
from app.repositories.base import BaseRepository


class LeaseRepository(BaseRepository[Lease]):
    model = Lease

    async def list_for_tenant(self, tenant_id: uuid.UUID) -> list[Lease]:
        result = await self.session.execute(
            select(Lease).where(Lease.tenant_id == tenant_id).order_by(Lease.created_at.desc())
        )
        return list(result.scalars().all())

import uuid

from sqlalchemy import func, select

from app.models.lease import LeaseVersion
from app.repositories.base import BaseRepository


class LeaseVersionRepository(BaseRepository[LeaseVersion]):
    model = LeaseVersion

    async def list_for_lease(self, lease_id: uuid.UUID) -> list[LeaseVersion]:
        result = await self.session.execute(
            select(LeaseVersion)
            .where(LeaseVersion.lease_id == lease_id)
            .order_by(LeaseVersion.version_number)
        )
        return list(result.scalars().all())

    async def get_latest_for_lease(self, lease_id: uuid.UUID) -> LeaseVersion | None:
        result = await self.session.execute(
            select(LeaseVersion)
            .where(LeaseVersion.lease_id == lease_id)
            .order_by(LeaseVersion.version_number.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def next_version_number(self, lease_id: uuid.UUID) -> int:
        result = await self.session.execute(
            select(func.max(LeaseVersion.version_number)).where(
                LeaseVersion.lease_id == lease_id
            )
        )
        current_max = result.scalar_one()
        return (current_max or 0) + 1

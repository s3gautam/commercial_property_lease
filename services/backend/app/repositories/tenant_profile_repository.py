import uuid

from sqlalchemy import select

from app.models.user import TenantProfile
from app.repositories.base import BaseRepository


class TenantProfileRepository(BaseRepository[TenantProfile]):
    model = TenantProfile

    async def get_by_user_id(self, user_id: uuid.UUID) -> TenantProfile | None:
        result = await self.session.execute(
            select(TenantProfile).where(TenantProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()

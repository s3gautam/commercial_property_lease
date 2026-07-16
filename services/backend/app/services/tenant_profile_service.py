import uuid

from app.models.user import TenantProfile
from app.repositories.tenant_profile_repository import TenantProfileRepository
from app.schemas.tenant_profile import TenantProfileUpsert


class TenantProfileNotFoundError(Exception):
    pass


class TenantProfileService:
    def __init__(self, profiles: TenantProfileRepository) -> None:
        self._profiles = profiles

    async def upsert(self, user_id: uuid.UUID, payload: TenantProfileUpsert) -> TenantProfile:
        profile = await self._profiles.get_by_user_id(user_id)
        if profile is None:
            return await self._profiles.create(
                TenantProfile(
                    user_id=user_id,
                    company_name=payload.company_name,
                    business_type=payload.business_type,
                )
            )

        profile.company_name = payload.company_name
        profile.business_type = payload.business_type
        return profile

    async def get_for_user(self, user_id: uuid.UUID) -> TenantProfile:
        profile = await self._profiles.get_by_user_id(user_id)
        if profile is None:
            raise TenantProfileNotFoundError("Tenant profile not found")
        return profile

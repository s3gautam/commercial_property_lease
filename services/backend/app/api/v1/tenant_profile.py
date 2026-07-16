from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db_session
from app.models.user import User
from app.repositories.tenant_profile_repository import TenantProfileRepository
from app.schemas.common import ApiResponse
from app.schemas.tenant_profile import TenantProfileRead, TenantProfileUpsert
from app.services.tenant_profile_service import TenantProfileNotFoundError, TenantProfileService

router = APIRouter(prefix="/tenant-profile", tags=["tenant-profile"])


def get_tenant_profile_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> TenantProfileService:
    return TenantProfileService(TenantProfileRepository(session))


@router.get("/me", response_model=ApiResponse[TenantProfileRead])
async def get_my_tenant_profile(
    current_user: Annotated[User, Depends(get_current_user)],
    profile_service: Annotated[TenantProfileService, Depends(get_tenant_profile_service)],
) -> ApiResponse[TenantProfileRead]:
    try:
        profile = await profile_service.get_for_user(current_user.id)
    except TenantProfileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return ApiResponse(success=True, data=TenantProfileRead.model_validate(profile))


@router.put("/me", response_model=ApiResponse[TenantProfileRead])
async def upsert_my_tenant_profile(
    payload: TenantProfileUpsert,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    profile_service: Annotated[TenantProfileService, Depends(get_tenant_profile_service)],
) -> ApiResponse[TenantProfileRead]:
    profile = await profile_service.upsert(current_user.id, payload)
    await session.commit()

    return ApiResponse(success=True, data=TenantProfileRead.model_validate(profile))

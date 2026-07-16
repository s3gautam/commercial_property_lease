import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db_session
from app.models.user import User
from app.repositories.lease_repository import LeaseRepository
from app.repositories.lease_version_repository import LeaseVersionRepository
from app.repositories.property_repository import PropertyRepository
from app.schemas.common import ApiResponse
from app.schemas.lease import (
    LeaseCreate,
    LeaseRead,
    LeaseVersionRead,
    LeaseWithVersionsRead,
)
from app.services.lease_service import (
    LeaseDraftNotFoundError,
    LeaseNotFoundError,
    LeaseService,
)
from app.services.property_service import PropertyNotFoundError

router = APIRouter(prefix="/leases", tags=["leases"])


def get_lease_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> LeaseService:
    return LeaseService(
        LeaseRepository(session), LeaseVersionRepository(session), PropertyRepository(session)
    )


@router.post("", response_model=ApiResponse[LeaseRead])
async def create_lease(
    payload: LeaseCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    lease_service: Annotated[LeaseService, Depends(get_lease_service)],
) -> ApiResponse[LeaseRead]:
    try:
        lease = await lease_service.create_lease(
            current_user.id, payload.property_id, payload.start_date, payload.end_date
        )
    except PropertyNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    await session.commit()
    return ApiResponse(success=True, data=LeaseRead.model_validate(lease))


@router.get("", response_model=ApiResponse[list[LeaseRead]])
async def list_my_leases(
    current_user: Annotated[User, Depends(get_current_user)],
    lease_service: Annotated[LeaseService, Depends(get_lease_service)],
) -> ApiResponse[list[LeaseRead]]:
    leases = await lease_service.list_my_leases(current_user.id)
    return ApiResponse(success=True, data=[LeaseRead.model_validate(lease) for lease in leases])


@router.get("/{lease_id}", response_model=ApiResponse[LeaseWithVersionsRead])
async def get_lease(
    lease_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    lease_service: Annotated[LeaseService, Depends(get_lease_service)],
) -> ApiResponse[LeaseWithVersionsRead]:
    try:
        lease, versions = await lease_service.get_lease_with_versions(lease_id, current_user.id)
    except LeaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return ApiResponse(
        success=True,
        data=LeaseWithVersionsRead(
            lease=LeaseRead.model_validate(lease),
            versions=[LeaseVersionRead.model_validate(v) for v in versions],
        ),
    )


@router.post("/{lease_id}/draft", response_model=ApiResponse[LeaseVersionRead])
async def draft_lease_document(
    lease_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    lease_service: Annotated[LeaseService, Depends(get_lease_service)],
) -> ApiResponse[LeaseVersionRead]:
    try:
        version = await lease_service.draft_document(lease_id, current_user.id)
    except (LeaseNotFoundError, PropertyNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    await session.commit()
    return ApiResponse(success=True, data=LeaseVersionRead.model_validate(version))


@router.post("/{lease_id}/summary", response_model=ApiResponse[LeaseVersionRead])
async def summarize_lease_document(
    lease_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    lease_service: Annotated[LeaseService, Depends(get_lease_service)],
) -> ApiResponse[LeaseVersionRead]:
    try:
        version = await lease_service.summarize_latest(lease_id, current_user.id)
    except LeaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except LeaseDraftNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    await session.commit()
    return ApiResponse(success=True, data=LeaseVersionRead.model_validate(version))

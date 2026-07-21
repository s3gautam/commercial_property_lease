import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_notification_sender
from app.core.database import get_db_session
from app.models.user import User
from app.repositories.property_repository import PropertyRepository
from app.repositories.visit_repository import VisitRepository
from app.schemas.common import ApiResponse
from app.schemas.visit import VisitCreate, VisitRead, VisitReschedule
from app.services.booking_notification_service import BookingNotificationService
from app.services.notification_sender import NotificationSender
from app.services.visit_service import (
    SlotUnavailableError,
    VisitConflictError,
    VisitNotFoundError,
    VisitService,
    VisitWithProperty,
)

router = APIRouter(prefix="/visits", tags=["visits"])


def _to_visit_read(vwp: VisitWithProperty) -> VisitRead:
    return VisitRead(
        id=vwp.visit.id,
        property_id=vwp.visit.property_id,
        property_title=vwp.property_title,
        tenant_id=vwp.visit.tenant_id,
        visit_date=vwp.visit.visit_date,
        visit_time=vwp.visit.visit_time,
        status=vwp.visit.status,
        created_at=vwp.visit.created_at,
    )


def get_visit_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    notification_sender: Annotated[NotificationSender, Depends(get_notification_sender)],
) -> VisitService:
    return VisitService(
        VisitRepository(session),
        PropertyRepository(session),
        BookingNotificationService(notification_sender),
    )


@router.post("", response_model=ApiResponse[VisitRead])
async def book_visit(
    payload: VisitCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    visit_service: Annotated[VisitService, Depends(get_visit_service)],
) -> ApiResponse[VisitRead]:
    try:
        visit = await visit_service.book_visit(
            current_user.id,
            current_user.email,
            payload.property_id,
            payload.visit_date,
            payload.visit_time,
        )
    except VisitNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except SlotUnavailableError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except VisitConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.message) from exc

    await session.commit()
    return ApiResponse(success=True, data=_to_visit_read(visit))


@router.get("", response_model=ApiResponse[list[VisitRead]])
async def list_my_visits(
    current_user: Annotated[User, Depends(get_current_user)],
    visit_service: Annotated[VisitService, Depends(get_visit_service)],
) -> ApiResponse[list[VisitRead]]:
    visits = await visit_service.list_my_visits(current_user.id)
    return ApiResponse(success=True, data=[_to_visit_read(v) for v in visits])


@router.patch("/{visit_id}/reschedule", response_model=ApiResponse[VisitRead])
async def reschedule_visit(
    visit_id: uuid.UUID,
    payload: VisitReschedule,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    visit_service: Annotated[VisitService, Depends(get_visit_service)],
) -> ApiResponse[VisitRead]:
    try:
        visit = await visit_service.reschedule_visit(
            visit_id,
            current_user.id,
            current_user.email,
            payload.visit_date,
            payload.visit_time,
        )
    except VisitNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except SlotUnavailableError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except VisitConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.message) from exc

    await session.commit()
    return ApiResponse(success=True, data=_to_visit_read(visit))


@router.post("/{visit_id}/cancel", response_model=ApiResponse[VisitRead])
async def cancel_visit(
    visit_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    visit_service: Annotated[VisitService, Depends(get_visit_service)],
) -> ApiResponse[VisitRead]:
    try:
        visit = await visit_service.cancel_visit(visit_id, current_user.id)
    except VisitNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    await session.commit()
    return ApiResponse(success=True, data=_to_visit_read(visit))

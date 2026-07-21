import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db_session
from app.models.user import User
from app.repositories.property_repository import PropertyRepository
from app.repositories.watchlist_repository import WatchlistRepository
from app.schemas.common import ApiResponse
from app.schemas.property import PropertyRead
from app.schemas.watchlist import WatchlistAdd
from app.services.watchlist_service import PropertyNotFoundError, WatchlistService

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


def get_watchlist_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> WatchlistService:
    return WatchlistService(WatchlistRepository(session), PropertyRepository(session))


@router.get("", response_model=ApiResponse[list[PropertyRead]])
async def list_my_watchlist(
    current_user: Annotated[User, Depends(get_current_user)],
    watchlist_service: Annotated[WatchlistService, Depends(get_watchlist_service)],
) -> ApiResponse[list[PropertyRead]]:
    properties = await watchlist_service.list_my_watchlist(current_user.id)
    return ApiResponse(success=True, data=[PropertyRead.model_validate(p) for p in properties])


@router.post("", response_model=ApiResponse[PropertyRead])
async def add_to_watchlist(
    payload: WatchlistAdd,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    watchlist_service: Annotated[WatchlistService, Depends(get_watchlist_service)],
) -> ApiResponse[PropertyRead]:
    try:
        property_ = await watchlist_service.add(current_user.id, payload.property_id)
    except PropertyNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    await session.commit()
    return ApiResponse(success=True, data=PropertyRead.model_validate(property_))


@router.delete("/{property_id}", response_model=ApiResponse[None])
async def remove_from_watchlist(
    property_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    watchlist_service: Annotated[WatchlistService, Depends(get_watchlist_service)],
) -> ApiResponse[None]:
    await watchlist_service.remove(current_user.id, property_id)
    await session.commit()
    return ApiResponse(success=True, data=None)

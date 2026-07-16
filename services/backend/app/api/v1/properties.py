import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.repositories.property_repository import PropertyRepository
from app.schemas.common import ApiResponse
from app.schemas.property import PropertyRead
from app.services.property_service import PropertyNotFoundError, PropertyService

router = APIRouter(prefix="/properties", tags=["properties"])


def get_property_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> PropertyService:
    return PropertyService(PropertyRepository(session))


@router.get("", response_model=ApiResponse[list[PropertyRead]])
async def browse_properties(
    property_service: Annotated[PropertyService, Depends(get_property_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    city: Annotated[str | None, Query()] = None,
) -> ApiResponse[list[PropertyRead]]:
    properties, total = await property_service.browse(page, page_size, city)

    return ApiResponse(
        success=True,
        data=[PropertyRead.model_validate(p) for p in properties],
        meta={"page": page, "page_size": page_size, "total": total},
    )


@router.get("/{property_id}", response_model=ApiResponse[PropertyRead])
async def get_property(
    property_id: uuid.UUID,
    property_service: Annotated[PropertyService, Depends(get_property_service)],
) -> ApiResponse[PropertyRead]:
    try:
        property_ = await property_service.get_listed_property(property_id)
    except PropertyNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return ApiResponse(success=True, data=PropertyRead.model_validate(property_))

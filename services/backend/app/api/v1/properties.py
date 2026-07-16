import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db_session
from app.models.user import User
from app.repositories.property_repository import PropertyRepository
from app.repositories.verification_report_repository import VerificationReportRepository
from app.schemas.common import ApiResponse
from app.schemas.property import PropertyRead
from app.schemas.search import PropertySearchResponse, SearchCriteriaRead
from app.schemas.verification import VerificationReportRead
from app.services.property_service import PropertyNotFoundError, PropertyService
from app.services.verification_service import (
    VerificationReportNotFoundError,
    VerificationService,
)

router = APIRouter(prefix="/properties", tags=["properties"])


def get_property_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> PropertyService:
    return PropertyService(PropertyRepository(session))


def get_verification_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> VerificationService:
    return VerificationService(PropertyRepository(session), VerificationReportRepository(session))


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


@router.get("/search", response_model=ApiResponse[PropertySearchResponse])
async def search_properties(
    property_service: Annotated[PropertyService, Depends(get_property_service)],
    q: Annotated[str, Query(min_length=1, max_length=500)],
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
) -> ApiResponse[PropertySearchResponse]:
    agent_response = await property_service.search(q, limit=limit)
    result = agent_response.response

    return ApiResponse(
        success=True,
        data=PropertySearchResponse(
            criteria=SearchCriteriaRead(
                city=result.criteria.city,
                max_rent=result.criteria.max_rent,
                min_area_sqft=result.criteria.min_area_sqft,
                keywords=result.criteria.keywords,
                explanation=result.criteria.explanation,
            ),
            properties=[PropertyRead.model_validate(p) for p in result.properties],
            confidence=agent_response.confidence,
        ),
        meta={
            "latency_ms": agent_response.latency_ms,
            "total_tokens": agent_response.total_tokens,
            "validation_status": agent_response.validation_status,
        },
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


@router.get(
    "/{property_id}/verification", response_model=ApiResponse[VerificationReportRead]
)
async def get_verification_report(
    property_id: uuid.UUID,
    verification_service: Annotated[VerificationService, Depends(get_verification_service)],
) -> ApiResponse[VerificationReportRead]:
    try:
        report = await verification_service.get_latest_report(property_id)
    except VerificationReportNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return ApiResponse(success=True, data=VerificationReportRead.model_validate(report))


@router.post(
    "/{property_id}/verification", response_model=ApiResponse[VerificationReportRead]
)
async def generate_verification_report(
    property_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    verification_service: Annotated[VerificationService, Depends(get_verification_service)],
    _current_user: Annotated[User, Depends(get_current_user)],
) -> ApiResponse[VerificationReportRead]:
    try:
        report = await verification_service.generate_report(property_id)
    except PropertyNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    await session.commit()

    return ApiResponse(success=True, data=VerificationReportRead.model_validate(report))
